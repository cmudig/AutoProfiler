import type { ISessionContext } from '@jupyterlab/apputils';
// import type { IOutput } from '@jupyterlab/nbformat';
import type { //Kernel,
    KernelMessage
} from '@jupyterlab/services';
// import { type ISignal, Signal } from '@lumino/signaling';
import type { NotebookAPI } from './dataAPI/jupyter/notebook'

import { dataFramesAndCols } from './stores';

import type {
    IColTypeTuple,
    IDFColMap,
    IQuantMeta,
    IColMeta,
    IHistogram,
    ValueCount
} from "./dataAPI/exchangeInterfaces"

type ExecResult = { "content": string[], "exec_count": number }


export class ProfileModel { // implements Executor 

    private _sessionContext: ISessionContext;
    private _notebook: NotebookAPI;
    private _ready: boolean = false;

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
        // return this.session.kernelDisplayName;
        return this.session.name;
    }

    public async connectNotebook(notebook: NotebookAPI) {
        console.log("Connecting notebook to ProfilePanel")
        this._notebook = notebook;
        this.setSession(notebook.panel.sessionContext)

        await this.session.ready;
        // have to do this as arrow function or else this doesnt work
        this._notebook.changed.connect((sender, value) => {
            if (value === "cell run") {
                this.updateRootData()
            }
        })
        this._ready = true
        this.updateRootData()
    }


    public async updateRootData() {
        let alldf = await this.getAllDataFrames()
        dataFramesAndCols.set(alldf)
    }

    // #############################################################################
    // Code execution helpers

    private sendCodeToKernel(
        code: string,
        onReply?: (type: string, content: any) => void,
        onDone?: (arg_0?: string) => void
    ) {
        // await this.ready
        let future = this.session.session?.kernel?.requestExecute({
            code,
            stop_on_error: true
        });

        // this is the output of the execution, may return things multiple times as code runs
        future.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
            var msg_type = msg.header.msg_type;

            if ((msg_type === 'execute_result')
                || (msg_type === 'display_data')
                || (msg_type === 'update_display_data')
                || (msg_type === 'stream')
            ) {
                if (onReply) onReply(msg_type + '', msg.content);
            }
        };

        // when execution is done
        future.done.then(
            reply => {
                if (onDone) onDone(reply.content.status);
                // reply.content.execution_count // time this code was run
            },
            error => {
                console.error('Code run failed: ', error);
                if (onDone) onDone();
            }
        );
    }

    private async executeCode(code: string = ''): Promise<ExecResult> {
        // await this.ready;

        return new Promise<ExecResult>(resolve => {
            let response: ExecResult = { "content": [], "exec_count": null }
            let contentMatrix: string[][] = []

            let onReply = (type: string, content: any) => {
                if ((type === 'execute_result') || (type === 'display_data') || (type === 'update_display_data')) {
                    let cont: string[] = content.data['text/plain'].split('\n');
                    response.exec_count = content.execution_count // does not exist on message for streams
                    contentMatrix.push(cont)
                } else if (type === "stream") {
                    let cont: string[] = content.text.split('\n');
                    contentMatrix.push(cont)
                } else {
                    console.log("Unhandled message type: ", type, "with content ", content)
                }
            };

            let onDone = (status: string) => {
                let flat_array = Array.prototype.concat(...contentMatrix)
                response["content"] = flat_array
                // console.log(`${code} finished with status [${status}]. Response: `, response)

                resolve(response)
            }

            this.sendCodeToKernel(code, onReply, onDone);
        });
    }

    // #############################################################################
    // python data functions

    public async getAllDataFrames(): Promise<IDFColMap> {
        await this.ready;
        let var_names = await this.getVariableNames();

        if (var_names) {
            let isDF = await this.getDFVars(var_names);
            let vars_DF = var_names.filter((d, idx) => isDF[idx] === "True")

            if (vars_DF) {

                // TODO update this to async so more reactive https://zellwk.com/blog/async-await-in-loops/
                let dfColMap: IDFColMap = {};
                for (let index = 0; index < vars_DF.length; index++) {
                    let columns = await this.getColumns(vars_DF[index]);

                    // columns is array of strings
                    let columnTuples: IColTypeTuple[] = columns.reduce((totalArr, current_txt) => {

                        if (current_txt !== "dtype: object") {
                            let [_name, _type] = current_txt.split(/\s+/)
                            if (_name && _type) {
                                totalArr.push({ "col_name": _name, "col_type": _type })
                            }
                        }
                        return totalArr
                    }, [])

                    dfColMap[vars_DF[index]] = columnTuples
                }

                return dfColMap
            }
        }
    }

    public async getVariableNames(): Promise<string[]> {
        let code = '%who_ls'; // a python magic command

        return new Promise<string[]>(resolve => {
            let onReply = (type: string, content: any) => {
                if (type == 'execute_result') {
                    // parse data into usable format
                    let data = (content.data['text/plain'] + '').replace(/'/g, '"');
                    let jsn = `{"names": ${data}}`;
                    let names = JSON.parse(jsn).names;

                    // return variable names
                    resolve(names);
                }
            };

            this.sendCodeToKernel(code, onReply);
        });
    }

    private async getDFVars(varNames: string[]): Promise<string[]> {
        /*
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code_lines = ['import pandas as pd']; // TODO better way to make sure pandas in env?
        varNames.forEach(name => code_lines.push(`print(type(${name}) == pd.DataFrame)`))

        let res = await this.executeCode(code_lines.join('\n'));
        let content = res["content"]

        return content
    }

    private async getColumns(varName: string): Promise<string[]> {
        /*
        varNames is array of variables that are pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code = `print(${varName}.dtypes)`;
        let res = await this.executeCode(code);
        let content = res["content"]
        return content
    }

    public async getShape(dfName: string, colInfo?: IColTypeTuple[]): Promise<number[]> {
        let code = `print(${dfName}.shape)`; // returns '(3, 2)' so need to parse
        let res = await this.executeCode(code);
        let content = res["content"]

        let shapeString = content[0];

        return shapeString
            .substring(1, shapeString.length - 1)
            .split(",")
            .map(x => parseFloat(x))
    }

    public async getColHeadRows(dfName: string, colName: string, n: number = 5): Promise<string[]> {
        /*
        Pandas print shows the index along with dataframe description so have to be trimmed off
        */
        const code = `print(${dfName}["${colName}"].head(${n}))`;
        let res = await this.executeCode(code);
        let content = res["content"]

        return content.slice(0, -2).map(x => x.split(/\s+/)[1])
    }

    public async getQuantMeta(dfName: string, colName: string): Promise<IQuantMeta> {
        // code to execute
        let min_code = `print(${dfName}["${colName}"].min())`
        let q25_code = `print(${dfName}["${colName}"].quantile(q=.25))`
        let q50_code = `print(${dfName}["${colName}"].quantile(q=.50))`
        // let median_code = `print(${dfName}["${colName}"].median())`
        let q75_code = `print(${dfName}["${colName}"].quantile(q=.75))`
        let max_code = `print(${dfName}["${colName}"].max())`
        let mean_code = `print(${dfName}["${colName}"].mean())`

        // execute and parse
        let code_lines = [min_code,
            q25_code,
            q50_code,
            q75_code,
            max_code,
            mean_code]
        let res = await this.executeCode(code_lines.join('\n'));
        let content = res["content"]

        return {
            "min": parseFloat(content[0]),
            "q25": parseFloat(content[1]),
            "q50": parseFloat(content[2]),
            "q75": parseFloat(content[3]),
            "max": parseFloat(content[4]),
            "mean": parseFloat(content[5])
        }
    }

    // public async getNomMeta(dfName: string, colName: string): Promise<INomMeta> {
    //     let numUnique_code = `print(${dfName}["${colName}"].nunique())`
    //     let numNull_code = `print(${dfName}["${colName}"].isna().sum())`
    //     let code_lines = [numUnique_code, numNull_code]
    //     let res = await this.executeCode(code_lines.join('\n'));

    //     let content = res["content"]
    //     return { "num_unique": content[0], "num_invalid": content[1] }
    // }

    public async getColMeta(dfName: string, colName: string): Promise<IColMeta> {
        // Code to execute
        let numUnique_code = `print(${dfName}["${colName}"].nunique())`
        let numNull_code = `print(${dfName}["${colName}"].isna().sum())`

        // execute and parse
        let code_lines = [numUnique_code, numNull_code]
        let res = await this.executeCode(code_lines.join('\n'));
        let content = res["content"]
        return {
            "numUnique": parseInt(content[0]),
            "nullCount": parseInt(content[1])
        }
    }


    async getValueCounts(dfName: string, colName: string, n: number = 10): Promise<ValueCount[]> {
        /*
        *   Returns data for VL spec to plot nominal data. In form of array of shape
        *   [ { [colName]: 0, "count": 5 }, { [colName]: 1, "count": 15 } ]
        */

        let code = `print(${dfName}["${colName}"].value_counts().iloc[:${n}].to_json())`
        let res = await this.executeCode(code);
        let data: ValueCount[] = []
        let content = res["content"]
        let json_res = JSON.parse(content[0].replace(/'/g, "")) // remove single quotes bc not JSON parseable
        Object.keys(json_res).forEach(k => {
            data.push({ "value": k, "count": json_res[k] })
        })

        return data
    }

    async getQuantBinnedData(dfName: string, colName: string, maxbins: number = 5): Promise<IHistogram> {
        /*
        *   Returns data for VL spec to plot quant data. In form of array of shape
        *   [ { "bin_0": 0, "bin_1": 1, "count": 5 }, ]
        */

        let code = `print(${dfName}["${colName}"].value_counts(bins=min(${maxbins}, ${dfName}["${colName}"].nunique()), sort=False).to_json())`
        let res = await this.executeCode(code);
        let content = res["content"]

        let json_res = JSON.parse(content[0].replace(/'/g, "")) // remove single quotes bc not JSON parseable
        let data: IHistogram = []

        Object.keys(json_res).forEach((k, i) => {
            let cleank = k.replace(/[\])}[{(]/g, '') // comes in interval formatting like [22, 50)
            let [low, high] = cleank.split(",")

            data.push({ "low": parseFloat(low), "high": parseFloat(high), "count": json_res[k], "bucket": i })
        })

        // let bin_size = data.length > 0 ? Math.abs(data[0].bin_1 - data[0].bin_0) : undefined

        return data
    }

}
