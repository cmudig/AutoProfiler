import type { ISessionContext } from '@jupyterlab/apputils';
import type { KernelMessage } from '@jupyterlab/services';
import type { NotebookAPI } from './jupyter/notebook';

import { dataFramesAndCols } from '../stores';

import type {
    IColTypeTuple,
    IDFColMap,
    IQuantMeta,
    IColMeta,
    IHistogram,
    ValueCount
} from '../common/exchangeInterfaces';

type ExecResult = { content: string[]; exec_count: number };

export class ProfileModel {
    // implements Executor

    private _sessionContext: ISessionContext;
    private _notebook: NotebookAPI;
    private _ready = false;

    constructor(session: ISessionContext) {
        this._sessionContext = session; // starts null
    }

    get ready(): boolean {
        return this._ready;
    }

    get session(): ISessionContext {
        return this._sessionContext;
    }

    public setSession(new_session: ISessionContext) {
        this._sessionContext = new_session;
    }

    get language(): Promise<string> | undefined {
        return this.session?.session?.kernel?.info?.then(infoReply => {
            return infoReply.language_info.name;
        });
    }

    get name(): string {
        return this.session?.name;
    }

    public async connectNotebook(notebook: NotebookAPI) {
        console.log('Connecting notebook to ProfilePanel');
        this._notebook = notebook;
        this.setSession(notebook.panel.sessionContext);
        this.resetData()

        await this.session.ready;
        // have to do this as arrow function or else this doesnt work
        this._notebook.changed.connect((sender, value) => {
            if (value === 'cell run') {
                this.updateRootData();
            }
        });
        this.listenForRestart();
        this._ready = true;
        this.updateRootData();
    }

    public async listenForRestart() {
        this.session.session?.kernel.statusChanged.connect((_, status) => {
            if (status.endsWith('restarting')) {
                // DO something
                console.log('[AutoProfile] resetting data on kernel restart.');
                this.resetData();
            }
        });
    }

    public resetData() {
        dataFramesAndCols.set(undefined);
    }

    public async updateRootData() {
        const alldf = await this.getAllDataFrames();
        dataFramesAndCols.set(alldf);
    }

    // #############################################################################
    // Code execution helpers

    private sendCodeToKernel(
        code: string,
        onReply?: (type: string, content: any) => void,
        onDone?: (arg_0?: string) => void
    ) {
        // await this.ready
        const future = this.session.session?.kernel?.requestExecute({
            code,
            stop_on_error: true
        });

        // this is the output of the execution, may return things multiple times as code runs
        future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
            const msg_type = msg.header.msg_type;

            if (
                msg_type === 'execute_result' ||
                msg_type === 'display_data' ||
                msg_type === 'update_display_data' ||
                msg_type === 'stream'
            ) {
                if (onReply) {
                    onReply(msg_type + '', msg.content);
                }
            }
        };

        // when execution is done
        future.done.then(
            reply => {
                if (onDone) {
                    onDone(reply.content.status);
                }
                // reply.content.execution_count // time this code was run
            },
            error => {
                console.warn('Code run failed: ', error);
                if (onDone) {
                    onDone();
                }
            }
        );
    }

    private async executeCode(code: string): Promise<ExecResult> {
        // await this.ready;

        return new Promise<ExecResult>(resolve => {
            const response: ExecResult = {
                content: [],
                exec_count: null
            };
            const contentMatrix: string[][] = [];

            const onReply = (type: string, content: any) => {
                if (
                    type === 'execute_result' ||
                    type === 'display_data' ||
                    type === 'update_display_data'
                ) {
                    const cont: string[] =
                        content.data['text/plain'].split('\n');
                    response.exec_count = content.execution_count; // does not exist on message for streams
                    contentMatrix.push(cont);
                } else if (type === 'stream') {
                    const cont: string[] = content.text.split('\n');
                    contentMatrix.push(cont);
                }
            };

            const onDone = (status: string) => {
                let flat_array = Array.prototype.concat(...contentMatrix);

                /* prevent empty strings that happen from extra returns at end of print(), 
                    this causes big issues if onReply() returns multiple times and the order of code results gets thrown off */
                flat_array = flat_array.filter(item => item !== '');
                response['content'] = flat_array;
                // console.log(`[executeCode] ${code} finished with status [${status}]. Response: `, response)
                resolve(response);
            };

            this.sendCodeToKernel(code, onReply, onDone);
        });
    }

    // #############################################################################
    // python data functions

    public async getAllDataFrames(): Promise<IDFColMap> {
        await this.ready;
        try {
            const var_names = await this.getVariableNames();

            if (var_names) {
                const isDF = await this.getDFVars(var_names);
                const vars_DF = var_names.filter(
                    (d, idx) => isDF[idx] === 'True'
                );

                if (vars_DF) {
                    // TODO update this to async so more reactive https://zellwk.com/blog/async-await-in-loops/
                    const dfColMap: IDFColMap = {};
                    const python_ids = await this.getObjectIds(vars_DF);

                    for (let index = 0; index < vars_DF.length; index++) {
                        const dfName = vars_DF[index];
                        const columns = await this.getColumns(dfName);

                        // columns is array of strings
                        const columnTuples: IColTypeTuple[] = columns.reduce(
                            (totalArr, current_txt) => {
                                if (current_txt !== 'dtype: object') {
                                    const [_name, _type] =
                                        current_txt.split(/\s+/);
                                    if (_name && _type) {
                                        totalArr.push({
                                            col_name: _name,
                                            col_type: _type
                                        });
                                    }
                                }
                                return totalArr;
                            },
                            []
                        );

                        dfColMap[dfName] = {
                            columns: columnTuples,
                            python_id: python_ids[index]
                        };
                    }
                    return dfColMap;
                }
            }
        } catch (error) {
            console.warn('[Error caught] in getAllDataFrames', error);
            return undefined;
        }
    }

    public async getVariableNames(): Promise<string[]> {
        try {
            const code = '%who_ls'; // python magic command
            const res = await this.executeCode(code);
            const content = res['content'];
            let data = content[0].replace(/'/g, '"');
            const names = JSON.parse(data);
            return names;
        } catch (error) {
            console.warn('[Error caught] in getVariableNames', error);
            return [];
        }
    }

    private async getDFVars(varNames: string[]): Promise<string[]> {
        /*
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        try {
            const code_lines = ['import pandas as pd']; // TODO better way to make sure pandas in env?
            varNames.forEach(name =>
                code_lines.push(`print(type(${name}) == pd.DataFrame)`)
            );
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'];
            return content;
        } catch (error) {
            console.warn('[Error caught] in getDFVars', error);
            return [];
        }
    }

    private async getObjectIds(varNames: string[]): Promise<string[]> {
        /*
        Returns array of python object ids for varNames. Used to see if id has changed and update interface.
        */
        try {
            const code_lines = [];
            varNames.forEach(name => code_lines.push(`print(id(${name}))`));
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'];
            return content;
        } catch (error) {
            console.warn('[Error caught] in getObjectIds', error);
            return [];
        }
    }

    private async getColumns(varName: string): Promise<string[]> {
        /*
        varNames is array of variables that are pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        try {
            const code = `print(${varName}.dtypes)`;
            const res = await this.executeCode(code);
            const content = res['content'];
            return content;
        } catch (error) {
            console.warn('[Error caught] in getColumns', error);
            return [];
        }
    }

    public async getShape(dfName: string): Promise<number[]> {
        /*
        returns tuple array [length, width]
        */
        try {
            const code = `print(${dfName}.shape)`; // returns '(3, 2)' so need to parse
            const res = await this.executeCode(code);
            const content = res['content'];
            const shapeString = content[0];
            return shapeString
                .substring(1, shapeString.length - 1)
                .split(',')
                .map(x => parseFloat(x));
        } catch (error) {
            console.warn('[Error caught] in getShape', error);
            return [undefined, undefined];
        }
    }

    public async getQuantMeta(
        dfName: string,
        colName: string
    ): Promise<IQuantMeta> {
        try {
            const code = `print(${dfName}["${colName}"].describe().to_json())`;
            const res = await this.executeCode(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content[0]?.replace(/'/g, '')); // remove single quotes bc not JSON parseable

            return {
                min: parseFloat(json_res['min']),
                q25: parseFloat(json_res['25%']),
                q50: parseFloat(json_res['50%']),
                q75: parseFloat(json_res['75%']),
                max: parseFloat(json_res['max']),
                mean: parseFloat(json_res['mean'])
            };
        } catch (error) {
            console.warn('[Error caught] in getQuantMeta', error);
            return {
                min: undefined,
                q25: undefined,
                q50: undefined,
                q75: undefined,
                max: undefined,
                mean: undefined
            };
        }
    }

    public async getColMeta(
        dfName: string,
        colName: string
    ): Promise<IColMeta> {
        try {
            // Code to execute
            const numUnique_code = `print(${dfName}["${colName}"].nunique())`;
            const numNull_code = `print(${dfName}["${colName}"].isna().sum())`;
            // execute and parse
            const code_lines = [numUnique_code, numNull_code];
            const res = await this.executeCode(code_lines.join('\n'));
            const content = res['content'];
            return {
                numUnique: parseInt(content[0]),
                nullCount: parseInt(content[1])
            };
        } catch (error) {
            console.warn('[Error caught] in getColMeta', error);
            return {
                numUnique: undefined,
                nullCount: undefined
            };
        }
    }

    public async getValueCounts(
        dfName: string,
        colName: string,
        n = 10
    ): Promise<ValueCount[]> {
        /*
         *   Returns data for VL spec to plot nominal data. In form of array of shape
         *   [ { [colName]: 0, "count": 5 }, { [colName]: 1, "count": 15 } ]
         */
        try {
            const code = `print(${dfName}["${colName}"].value_counts().iloc[:${n}].to_json())`;
            const res = await this.executeCode(code);
            const data: ValueCount[] = [];
            const content = res['content']; // might be null
            const json_res = JSON.parse(content[0]?.replace(/'/g, '')); // remove single quotes bc not JSON parseable
            Object.keys(json_res).forEach(k => {
                data.push({ value: k, count: json_res[k] });
            });
            return data;
        } catch (error) {
            console.warn('[Error caught] in getValueCounts', error);
            return [];
        }
    }

    public async getQuantBinnedData(
        dfName: string,
        colName: string,
        maxbins = 10
    ): Promise<IHistogram> {
        /*
         *   Returns data for VL spec to plot quant data. In form of array of shape
         *   [ { "bin_0": 0, "bin_1": 1, "count": 5 }, ]
         */
        try {
            const code = `print(${dfName}["${colName}"].value_counts(bins=min(${maxbins}, ${dfName}["${colName}"].nunique()), sort=False).to_json())`;
            const res = await this.executeCode(code);
            const content = res['content'];
            const data: IHistogram = [];
            const json_res = JSON.parse(content[0].replace(/'/g, '')); // remove single quotes bc not JSON parseable

            Object.keys(json_res).forEach((k, i) => {
                const cleank = k.replace(/[\])}[{(]/g, ''); // comes in interval formatting like [22, 50)
                const [low, high] = cleank.split(',');
                data.push({
                    low: parseFloat(low),
                    high: parseFloat(high),
                    count: json_res[k],
                    bucket: i
                });
            });
            return data;
        } catch (error) {
            console.warn('[Error caught] in getQuantBinnedData', error);
            return [];
        }
    }
}
