import type { IColTypeTuple, IDFColMap, IQuantMeta, INomMeta, IQuantChartData, INomChartData } from "./exchangeInterfaces"

import type { ISessionContext } from '@jupyterlab/apputils';
import { PromiseDelegate } from '@lumino/coreutils';


// executor interface for ArqueroExecutor below
export interface Executor {
    // getColumn(colName: string): Promise<any>,
    // getColumns(): Promise<string[]>, // TODO rename to column names
    // getColumnTypes(): Promise<{ [colName: string]: string }>,

    // get rid of these through a different abstraction somehow...
    language: Promise<string> | undefined,
    name: string,
    ready: Promise<void>,

    getShape(dfName: string): Promise<number[]>,
    getAllDataFrames(): Promise<IDFColMap>,
    getColHeadRows(dfName: string, colName: string, n?: number): Promise<string[]>,
    getNomMeta(dfName: string, colName: string): Promise<INomMeta>,
    getQuantMeta(dfName: string, colName: string): Promise<IQuantMeta>,
    getNomColVisData(colName: string, n?: number): Promise<INomChartData>,
    getQuantBinnedData(colName: string, maxbins?: number): Promise<IQuantChartData>,
}

// API for single data table
export class JupyterPandasExecutor { // implements Executor {
    session: ISessionContext;
    private readonly _ready: PromiseDelegate<void>;
    public initialized: boolean = false;


    // constructor(session: ISessionContext) {
    //     this.session = session;
    // }

    constructor() {
        this._ready = new PromiseDelegate<void>();

    }

    init(session: ISessionContext) {
        this.initialized = true
        this.session = session;

        this.session.ready.then(() => {
            this._ready.resolve();
            console.log("Data accessor ready!")
        })

    }

    get ready(): Promise<void> {
        return this._ready.promise;
    }

    // ready is a Promise that resolves once the kernel is ready to use
    // get ready(): Promise<void> {
    //     return this.session.ready;
    // }

    // #############################################################################
    // Code execution helpers

    private runCode(
        code: string,
        onReply?: (type: string, content: any) => void,
        onDone?: (arg_0?: string) => void
    ) {
        // await this.ready
        let future = this.session.session.kernel.requestExecute({
            code,
            stop_on_error: true
        });

        // this is the output of the execution, may return things multiple times as code runs
        future.onIOPub = msg => {
            var msg_type = msg.header.msg_type;
            // console.log("Got message on IOPub of type: ", msg_type)
            if (
                msg_type === 'execute_result' ||
                msg_type === 'stream' ||
                msg_type === 'display_data' ||
                msg_type === 'update_display_data'
            )
                if (onReply) onReply(msg_type + '', msg.content);
        };

        // when execution is done
        future.done.then(
            reply => {
                if (onDone) onDone(reply.content.status);
            },
            error => {
                console.error('Code run failed: ', error);
                if (onDone) onDone();
            }
        );
    }

    private async executeCode(code: string = ''): Promise<string[]> {
        await this.ready;

        return new Promise<string[]>(resolve => {
            let onReply = (type: string, content: any) => {
                console.log("code executed: ", code, "\nReturned as ",type, "with content: ", content)

                if (type === 'stream') {
                    let response: string[] = content.text.split('\n');
                    response.pop();
                    resolve(response);

                } else if (type === 'execute_result') {
                    // TODO return this as json object, not strings...

                    let response: string[] = content.data['text/plain'].split('\n');

                    resolve(response);
                } else if (type === 'display_data' || type === 'update_display_data') {

                    // console.log("Code execution CONTENT returned: ", content)
                    // let data = (content.data['text/plain'] + '').replace(/'/g, '"');
                    // console.log("Code execution parsed DATA returned: ", data)

                    // TODO return this as json object, not strings...

                    // let response: string[] = content.data['text/plain'].split('\n');


                    resolve(["hihi"]);
                }
            };

            this.runCode(code, onReply);
        });
    }

    // #############################################################################
    // Kernel info

    get language(): Promise<string> | undefined {
        return this.session?.session?.kernel?.info?.then(infoReply => {
            return infoReply.language_info.name;
        });
    }

    get name(): string {
        return this.session.kernelDisplayName;
    }

    public async getEnv() {
        // make sure kernel is ready to run code
        await this.ready;

        let var_names = await this.getVariableNames();

        if (var_names) {
            let var_types = await this.getType(var_names);

            return { names: var_names, types: var_types };
        }
    }

    // #############################################################################
    // python data functions

    public async getAllDataFrames(): Promise<IDFColMap> {
        await this.ready;
        let var_names = await this.getVariableNames();

        if (var_names) {
            let isDF = await this.getDFVars(var_names);
            let vars_DF = var_names.filter((d, idx) => isDF[idx] === "True")

            console.log("The dataframes in memory are: ", vars_DF)

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

                console.log("dfCOlMap is: ", dfColMap)
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

            this.runCode(code, onReply);
        });
    }

    private async getType(varNames: string[]): Promise<string[]> {
        let code_lines: string[] = [];
        varNames.forEach(name => code_lines.push(`print(type(${name}).__name__)`));
        return this.executeCode(code_lines.join('\n'));
    }


    private async getDFVars(varNames: string[]): Promise<string[]> {
        /*
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code_lines = ['import pandas as pd']; // TODO better way to make sure pandas in env?
        varNames.forEach(name => code_lines.push(`print(type(${name}) == pd.DataFrame)`))
        return this.executeCode(code_lines.join('\n'));
    }

    private async getColumns(varName: string): Promise<string[]> {
        /*
        varNames is array of variables that are pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code = `print(${varName}.dtypes)`;
        return this.executeCode(code);
    }

    public async getShape(dfName: string): Promise<number[]> {
        let code = `print(${dfName}.shape)`; // returns '(3, 2)' so need to parse
        let shapeStringArr = await this.executeCode(code);
        let shapeString = shapeStringArr[0];

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

        return res.slice(0, -1).map(x => x.split(/\s+/)[1])
    }

    public async getQuantMeta(dfName: string, colName: string): Promise<IQuantMeta> {
        let mean_code = `print(${dfName}["${colName}"].mean())`
        let median_code = `print(${dfName}["${colName}"].median())`
        let numNull_code = `print(${dfName}["${colName}"].isna().sum())`
        let code_lines = [mean_code, median_code, numNull_code]
        let res = await this.executeCode(code_lines.join('\n'));
        // return new Promise(resolve => resolve({ "mean": res[0], "median": res[1], "num_invalid": res[2] }))
        return { "mean": res[0], "median": res[1], "num_invalid": res[2] }
    }

    public async getNomMeta(dfName: string, colName: string): Promise<INomMeta> {
        let numUnique_code = `print(${dfName}["${colName}"].nunique())`
        let numNull_code = `print(${dfName}["${colName}"].isna().sum())`
        let code_lines = [numUnique_code, numNull_code]
        let res = await this.executeCode(code_lines.join('\n'));
        // return new Promise(resolve => resolve({ "unique": res[0], "num_invalid": res[1] }))
        return { "num_unique": res[0], "num_invalid": res[1] }
    }


    async getNomColVisData(dfName: string, colName: string, n: number = 5): Promise<INomChartData> {

        let code = `${dfName}["${colName}"].value_counts()[:${n}]`
        let res = await this.executeCode(code);

        // res is array of strings where the values are the lines of print(code)
        let data = res.slice(0, -1).map(txt => {
            let [value, count] = txt.split(/\s+/)
            return { [colName]: [value], "count": [count] }
        })

        // let data = [
        //     { [colName]: 0, "count": 5 },
        //     { [colName]: 1, "count": 15 },
        //     { [colName]: 2, "count": 10 },
        //     { [colName]: 3, "count": 20 },
        // ]

        return data
    }

    async getQuantBinnedData(dfName: string, colName: string, maxbins: number = 5): Promise<IQuantChartData> {
        // FIXME implement this

        // let code = ""

        // let res = await this.executeCode(code, "execute_result");

        // console.log("code result in get quant data...", res)

        // let code = `import pandas as pd
        // binned = ${dfName}["${colName}"].value_counts(bins=${maxbins}, sort=False)
        // df_binned = pd.DataFrame({"bin_0": binned.index.left, 
        //                           "bin_1": binned.index.right, 
        //                           "count": binned.values})
        // df_binned`

        // let res = await this.executeCode(code);

        
        let code = `${dfName}` // returned as an execute result
        let res = await this.executeCode(code);
        console.log("getQuantBinnedData res: ", res)


        let data = [
            { "bin_0": 0, "bin_1": 1, "count": 5 },
            { "bin_0": 1, "bin_1": 2, "count": 15 },
            { "bin_0": 2, "bin_1": 3, "count": 10 },
            { "bin_0": 3, "bin_1": 4, "count": 20 },
        ]

        let bin_size = 1

        return { "binned_data": data, "bin_size": bin_size }

    }

}

