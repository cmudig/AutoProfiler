import type { ISessionContext } from '@jupyterlab/apputils';
import type { KernelMessage } from '@jupyterlab/services';
import type {
    IColTypeTuple,
    IDFColMap,
    IQuantMeta,
    IColMeta,
    IHistogram,
    ValueCount,
    Interval,
    TimeBin
} from '../../common/exchangeInterfaces';
import _ from 'lodash';


type ExecResult = { content: string[]; exec_count: number };

function replaceSpecial(input_str: string) {
    /*Format strings when writing code, need to escape double quotes (") 
    since the code uses same character, single quotes are fine (') */

    const res = input_str
        .replace(/\\/g, '\\\\') // escape backslashes
        .replace(/"/g, '\\"'); // escape double quotes
    return res;
}

export class PythonPandasExecutor {
    private _sessionContext: ISessionContext;

    constructor(session: ISessionContext) {
        this._sessionContext = session; // starts null
    }

    public setSession(new_session: ISessionContext) {
        this._sessionContext = new_session;
    }

    get session(): ISessionContext {
        return this._sessionContext;
    }

    // ################################## Code execution helpers ###########################################
    private sendCodeToKernel(
        code: string,
        onReply?: (type: string, content: any) => void,
        onDone?: (arg_0?: string) => void
    ) {
        const future = this.session.session?.kernel?.requestExecute({
            code,
            stop_on_error: true,
            store_history: false // prevents incrementing execution count for extension code
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
                    this causes big issues if onReply() returns multiple times and the order 
                    of code results gets thrown off. If future code intentionally prints blank
                    lines this will cause other issues. */
                flat_array = flat_array.filter(item => item !== '');
                response['content'] = flat_array;
                // console.log(`[executeCode] ${code} finished with status [${status}]. Response: `, response)
                resolve(response);
            };

            this.sendCodeToKernel(code, onReply, onDone);
        });
    }

    /**
     * If using the python package digautoprofiler, then it needs to be imported every time 
     * so this appends the import and then executes the code
     * @param code the code string
     */
    private executePythonAP(code: string): Promise<ExecResult> {
        const importCode = 'import digautoprofiler\n'

        return this.executeCode(importCode + code)
    }

    // ############################# Python kernel functions ################################################

    /**
     * Gets all python variables, checks which ones are pandas dataframes, then returns these dataframe names
     * and their columns along with the object id
     * @returns
     */
    public async getAllDataFrames(currentOutputName: string): Promise<IDFColMap> {
        try {
            const var_names = await this.getVariableNames(currentOutputName);

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
                        let { columnsWithTypes, duplicates } = await this.getColumns(dfName);
                        const warnings = []

                        if (!_.isEmpty(duplicates)) {
                            warnings.push({ warnMsg: `All columns must have unique names. The following columns are excluded: ${duplicates.join(', ')}.` })
                            columnsWithTypes = columnsWithTypes.filter(col => !duplicates.includes(col.col_name))
                        }

                        dfColMap[dfName] = {
                            columns: columnsWithTypes,
                            python_id: python_ids[index],
                            warnings
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

    public async getVariableNames(currentOutputName: string): Promise<string[]> {
        try {

            const code = `print([x for x in dir() if x == "${currentOutputName}" or x[0] != "_"])`
            const res = await this.executeCode(code);
            const content = res['content'];
            const data = content.join("").replace(/'/g, '"');
            if (data) {
                const names = JSON.parse(data);
                return names;
            }
            return []
        } catch (error) {
            return [];
        }
    }

    /**
     * NOTE: this function cannot be put in digautoprofiler python because evaluting the variable names 
     * does not work from a separate module 
     * @returns array of "True" or "False" if that variable is a pandas dataframe
     */
    private async getDFVars(varNames: string[]): Promise<string[]> {
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

    /**
     * Used to see if id has changed and update interface.
     * NOTE: this function cannot be put in digautoprofiler python because evaluting the variable names 
     * does not work from a separate module 
     * @returns array of python object ids for varNames
     */
    private async getObjectIds(varNames: string[]): Promise<string[]> {
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

    private async getColumns(dfName: string): Promise<{ columnsWithTypes: IColTypeTuple[], duplicates: string[] }> {
        /*
        dfName is variable that is pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        try {
            const res = await this.executePythonAP(`digautoprofiler.getColumns(${dfName})`);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            const columnsWithTypes: IColTypeTuple[] = []

            let uniqueNames = new Set<string>()
            let duplicatedNames = new Set<string>()

            for (const item of json_res) {
                columnsWithTypes.push({
                    col_name: item["colName"],
                    col_type: item["type"]
                })
                if (uniqueNames.has(item["colName"])) {
                    duplicatedNames.add(item["colName"])
                } else {
                    uniqueNames.add(item["colName"])
                }
            }

            return { columnsWithTypes, duplicates: Array.from(duplicatedNames) }
        } catch (error) {
            console.warn('[Error caught] in getColumns', error);
            return { columnsWithTypes: [], duplicates: [] };
        }
    }

    public async getShape(dfName: string): Promise<number[]> {
        /*
        returns tuple array [length, width]
        */
        try {
            const res = await this.executePythonAP(`digautoprofiler.getShape(${dfName})`);
            const content = res['content'];
            const shapeString = content.join("");
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
            const res = await this.executePythonAP(`digautoprofiler.getQuantMeta(${dfName}, "${replaceSpecial(colName)}")`);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join("").replace(/'/g, '')); // remove single quotes bc not JSON parseable

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
            const res = await this.executePythonAP(`digautoprofiler.getColMeta(${dfName}, "${replaceSpecial(colName)}")`);
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
        try {
            const res = await this.executePythonAP(`digautoprofiler.getValueCounts(${dfName}, "${replaceSpecial(colName)}", ${n})`);
            const data: ValueCount[] = [];
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join("").replace(/'/g, '')); // remove single quotes bc not JSON parseable
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
        maxbins = 20
    ): Promise<IHistogram> {
        try {
            const res = await this.executePythonAP(`digautoprofiler.getQuantBinnedData(${dfName}, "${replaceSpecial(colName)}", ${maxbins})`);
            const content = res['content'];
            const data: IHistogram = [];
            const json_res = JSON.parse(content.join().replace(/'/g, '')); // remove single quotes bc not JSON parseable

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

    public async getTempBinnedData(
        dfName: string,
        colName: string,
        maxbins = 200
    ): Promise<{ timebin: TimeBin[], histogram: IHistogram }> {
        try {
            const res = await this.executePythonAP(`digautoprofiler.getTempBinnedData(${dfName}, "${replaceSpecial(colName)}", ${maxbins})`);
            const content = res['content'];
            const timebinData: TimeBin[] = [];
            const histogram: IHistogram = []
            const json_res = JSON.parse(content[0].replace(/'/g, '')); // remove single quotes bc not JSON parseable
            const true_minimum = parseFloat(content[1]);

            Object.keys(json_res).forEach((k, i) => {
                const cleank = k.replace(/[\])}[{(]/g, ''); // comes in interval formatting like [22, 50)
                const [low, high] = cleank.split(',');

                const lowNum = parseFloat(low)
                const highNum = parseFloat(high)

                const lowDate = new Date(lowNum * 1000)
                const highDate = new Date(highNum * 1000)

                // for time detail chart
                timebinData.push({
                    // Pandas extends the minimum bin an arbitrary number below the col's minimum so we shift the lowest bin boundary to the actual minimum
                    ts_start: i === 0 ? new Date(true_minimum * 1000) : lowDate,
                    ts_end: highDate,
                    count: json_res[k],
                });

                // for histogram preview
                histogram.push(
                    {
                        low: i === 0 ? true_minimum : lowNum,
                        high: highNum,
                        count: json_res[k],
                        bucket: i
                    }
                )
            });
            return { timebin: timebinData, histogram: histogram };
        } catch (error) {
            console.warn('[Error caught] in getTempBinnedData', error);
            return { timebin: [], histogram: [] };
        }
    }

    /**
     * Get interval range of the temporal column.
     * TODO only getting days right now so need to get months or microseconds
     * @param dfName
     * @param colName
     * @returns Interval
     */
    public async getTempInterval(
        dfName: string,
        colName: string
    ): Promise<Interval> {
        try {
            const res = await this.executePythonAP(`digautoprofiler.getTempInterval(${dfName}, "${replaceSpecial(colName)}")`);
            const content = res['content'];
            return {
                months: 0,
                days: parseInt(content.join("")),
                micros: 0
            };
        } catch (error) {
            console.warn('[Error caught] in getColMeta', error);
            return {
                months: 0,
                days: 0,
                micros: 0
            };
        }
    }

    public async getVariableNamesInPythonStr(codeString: string): Promise<string[]> {
        try {
            const formattedCode = codeString.replace(/"/g, '\\"');
            const res = await this.executePythonAP(`digautoprofiler.getVariableNamesInPythonStr("""${formattedCode}""")`)
            let content = res["content"].join("")
            content = content.replace(/'/g, '"') // replace single quotes
            content = content.replace('{', '[')
            content = content.replace('}', ']')

            const vars = JSON.parse(content)

            return vars

        } catch (error) {
            return []
        }

    }
}