import type { ISessionContext } from '@jupyterlab/apputils';
import type { KernelMessage } from '@jupyterlab/services';
import type {
    IColTypeTuple,
    IDFColMap,
    IQuantMeta,
    IColMeta,
    IHistogram,
    ValueCount,
    Interval
} from '../../common/exchangeInterfaces';

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

    // ############################# Python kernel functions ################################################

    /**
     * Gets all python variables, checks which ones are pandas dataframes, then returns these dataframe names
     * and their columns along with the object id
     * @returns
     */
    public async getAllDataFrames(): Promise<IDFColMap> {
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
                        const columnTuples = await this.getColumns(dfName);

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
            const data = content.join("").replace(/'/g, '"');
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

    private async getColumns(varName: string): Promise<IColTypeTuple[]> {
        /*
        varNames is array of variables that are pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        try {
            const code = `print(${varName}.dtypes.to_json(default_handler=str))`;
            const res = await this.executeCode(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            const columnsWithTypes: IColTypeTuple[] = []

            for (const [key, value] of Object.entries(json_res)) {
                columnsWithTypes.push({ "col_name": key, "col_type": (value as string) })
            }

            return columnsWithTypes
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
            const code = `print(${dfName}["${replaceSpecial(
                colName
            )}"].describe().to_json())`;
            const res = await this.executeCode(code);
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
            // Code to execute
            const numUnique_code = `print(${dfName}["${replaceSpecial(
                colName
            )}"].nunique())`;
            const numNull_code = `print(${dfName}["${replaceSpecial(
                colName
            )}"].isna().sum())`;
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
            const code = `print(${dfName}["${replaceSpecial(
                colName
            )}"].value_counts().iloc[:${n}].to_json())`;
            const res = await this.executeCode(code);
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
        /*
         *   Returns data for VL spec to plot quant data. In form of array of shape
         *   [ { "bin_0": 0, "bin_1": 1, "count": 5 }, ]
         */
        try {
            const code = `print(${dfName}["${replaceSpecial(
                colName
            )}"].value_counts(bins=min(${maxbins}, ${dfName}["${replaceSpecial(
                colName
            )}"].nunique()), sort=False).to_json())`;
            const res = await this.executeCode(code);
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

    /**
     *
     * Get histogram for temporal column in unix epoch format (UTC time)
     * @param dfName: the dataframe
     * @param colName: the temporal column
     * @returns Histogram of format  [ { "low": 0, "high": 1, "count": 5, bucket: 0} ]
     */
    public async getTempBinnedData(
        dfName: string,
        colName: string,
        maxbins = 100
    ): Promise<IHistogram> {
        try {
            const bin_code = `print( (${dfName}["${replaceSpecial(
                colName
            )}"].astype("int64")//1e9).value_counts(bins=min(${maxbins}, ${dfName}["${replaceSpecial(
                colName
            )}"].nunique()), sort=False).to_json() )`;

            const min_value_code = `print((${dfName}["${replaceSpecial(
                colName
            )}"].astype("int64") // 1e9).min())`;

            const res = await this.executeCode(
                [bin_code, min_value_code].join('\n')
            );
            const content = res['content'];
            const data: IHistogram = [];
            const json_res = JSON.parse(content[0].replace(/'/g, '')); // remove single quotes bc not JSON parseable
            const true_minimum = parseFloat(content[1]);

            Object.keys(json_res).forEach((k, i) => {
                const cleank = k.replace(/[\])}[{(]/g, ''); // comes in interval formatting like [22, 50)
                const [low, high] = cleank.split(',');

                data.push({
                    // Pandas extends the minimum bin an arbitrary number below the col's minimum so we shift the lowest bin boundary to the actual minimum
                    low: i === 0 ? true_minimum : parseFloat(low),
                    high: parseFloat(high),
                    count: json_res[k],
                    bucket: i
                });
            });
            return data;
        } catch (error) {
            console.warn('[Error caught] in getTempBinnedData', error);
            return [];
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
            // Code to execute
            const code = `print((${dfName}["${replaceSpecial(
                colName
            )}"].max() - ${dfName}["${replaceSpecial(colName)}"].min()).days)`;

            // execute and parse
            const res = await this.executeCode(code);
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
            const codeLines = [
                "import tokenize, io",
                `print(set([ t.string for t in tokenize.generate_tokens(io.StringIO("""${formattedCode}""").readline) if t.type == 1]))`
            ]

            const code = codeLines.join("\n")

            const res = await this.executeCode(code)
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