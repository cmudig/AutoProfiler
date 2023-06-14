import type { ISessionContext } from '@jupyterlab/apputils';
import type { KernelMessage } from '@jupyterlab/services';
import type {
    IColTypeTuple,
    IDFColMap,
    ColumnProfileData,
    ValueCount,
    BivariateTimestampInfo
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
        if (!(this.session == undefined)) {


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

            const pandasImported = await this.checkIfPandasInModules()

            if (pandasImported) {
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
                                columnsWithTypes = columnsWithTypes.filter(col => !duplicates.includes(col.colName))
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
     * checks if pandas is in sys modules meaning it was imported before,
     * this way we do not import pandas unless was imported before
     * @returns true if pandas was imported before, false if not
     */
    private async checkIfPandasInModules(): Promise<boolean> {
        try {
            const code_lines = ["import sys as __autoprofiler_private_sys; print('pandas' in __autoprofiler_private_sys.modules)",
                "del __autoprofiler_private_sys"]

            const res = await this.executeCode(code_lines.join('\n'));

            const content = res['content'].join("").trim();
            if (content === 'True') {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * NOTE: this function cannot be put in digautoprofiler python because evaluting the variable names 
     * does not work from a separate module 
     * @returns array of "True" or "False" if that variable is a pandas dataframe
     */
    private async getDFVars(varNames: string[]): Promise<string[]> {
        try {
            const code_lines = ['import pandas as __autoprofilerPandas'];
            varNames.forEach(name =>
                code_lines.push(`print(type(${name}) == __autoprofilerPandas.DataFrame)`)
            );
            code_lines.push('del __autoprofilerPandas')
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

    public async getVariableNamesInPythonStr(codeString: string): Promise<string[]> {

        let pandasWasImported = await this.checkIfPandasInModules()

        if (pandasWasImported) {
            const formattedCode = codeString.replace(/"/g, '\\"');
            const code = `digautoprofiler.getVariableNamesInPythonStr("""${formattedCode}""")`;
            try {
                const res = await this.executePythonAP(code)
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
        return []
    }

    private async getColumns(dfName: string): Promise<{ columnsWithTypes: IColTypeTuple[], duplicates: string[] }> {
        /*
        dfName is variable that is pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        const code = `digautoprofiler.getColumns(${dfName})`
        try {
            const res = await this.executePythonAP(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));
            const columnsWithTypes: IColTypeTuple[] = []

            let uniqueNames = new Set<string>()
            let duplicatedNames = new Set<string>()

            for (const item of json_res) {
                columnsWithTypes.push({
                    colName: item["colName"],
                    colType: item["type"],
                    colIsIndex: item["isIndex"],
                })
                if (uniqueNames.has(item["colName"])) {
                    duplicatedNames.add(item["colName"])
                } else {
                    uniqueNames.add(item["colName"])
                }
            }

            return { columnsWithTypes, duplicates: Array.from(duplicatedNames) }
        } catch (error) {
            console.warn(`[Error caught] in getColumns executing code: ${code}`, error);
            return { columnsWithTypes: [], duplicates: [] };
        }
    }

    public async getShape(dfName: string): Promise<number[]> {
        /*
        returns tuple array [length, width]
        */
        const code = `digautoprofiler.getShape(${dfName})`
        try {
            const res = await this.executePythonAP(code);
            const content = res['content'];
            const shapeString = content.join("");
            return shapeString
                .substring(1, shapeString.length - 1)
                .split(',')
                .map(x => parseFloat(x));
        } catch (error) {
            console.warn(`[Error caught] in getShape executing: ${code}`, error);
            return [undefined, undefined];
        }
    }

    /**
     * Get all info for numeric column
     * @param dfName 
     * @param colInfo 
     * @returns ColumnProfileData with NumericSummary
     */
    public async getNumericData(dfName: string, colInfo: IColTypeTuple): Promise<ColumnProfileData> {
        const isIndexPy = colInfo.colIsIndex ? "True" : "False";
        const code = `digautoprofiler.getNumericData(${dfName}, "${replaceSpecial(colInfo.colName)}", ${isIndexPy})`;

        const cd: ColumnProfileData = {
            colName: colInfo.colName,
            colType: colInfo.colType,
            colIsIndex: colInfo.colIsIndex,
            nullCount: 0,
            summary: {
                histogram: [],
                quantMeta: undefined,
                summaryType: "numeric"
            },
        };

        try {
            const res = await this.executePythonAP(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            // parse info from json_res
            cd["nullCount"] = parseInt(json_res["nullCount"])
            cd.summary["histogram"] = json_res["histogram"]
            cd.summary["quantMeta"] = json_res["quantMeta"]
            return cd;
        } catch (error) {
            console.warn(`[Error caught] in getNumericData executing: ${code}`, error);
            return cd;
        }
    }

    /**
     * Get all info for temporal column
     * @param dfName 
     * @param colInfo 
     * @returns ColumnProfileData with TemporalSummary
     */
    public async getTemporalData(dfName: string, colInfo: IColTypeTuple): Promise<ColumnProfileData> {
        const isIndexPy = colInfo.colIsIndex ? "True" : "False";
        const code = `digautoprofiler.getTemporalData(${dfName}, "${replaceSpecial(colInfo.colName)}", ${isIndexPy})`;

        const cd: ColumnProfileData = {
            colName: colInfo.colName,
            colType: colInfo.colType,
            colIsIndex: colInfo.colIsIndex,
            nullCount: 0,
            summary: {
                histogram: [],
                timeInterval: undefined,
                temporalMeta: undefined,
                summaryType: "temporal"
            },
        };

        try {
            const res = await this.executePythonAP(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            // parse info from json_res
            cd["nullCount"] = parseInt(json_res["nullCount"])
            cd.summary["histogram"] = json_res["histogram"]
            cd.summary["temporalMeta"] = json_res["temporalMeta"]
            cd.summary["timeInterval"] = json_res["timeInterval"]
            return cd;
        } catch (error) {
            console.warn(`[Error caught] in getTemporalData executing: ${code}`, error);
            return cd;
        }
    }

    /**
    * Get all info for categorical column
    * @param dfName 
    * @param colInfo 
    * @returns ColumnProfileData with CategoricalSummary
    */
    public async getCategoricalData(dfName: string, colInfo: IColTypeTuple): Promise<ColumnProfileData> {
        const isIndexPy = colInfo.colIsIndex ? "True" : "False";
        const code = `digautoprofiler.getCategoricalData(${dfName}, "${replaceSpecial(colInfo.colName)}", ${isIndexPy})`;

        const cd: ColumnProfileData = {
            colName: colInfo.colName,
            colType: colInfo.colType,
            colIsIndex: colInfo.colIsIndex,
            nullCount: 0,
            summary: {
                cardinality: 0,
                topK: undefined,
                stringMeta: undefined,
                summaryType: "categorical"
            },
        };

        try {
            const res = await this.executePythonAP(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            // parse info from json_res
            cd.nullCount = parseInt(json_res["nullCount"])
            cd.summary["cardinality"] = parseInt(json_res["cardinality"])
            cd.summary["topK"] = json_res["topK"]
            cd.summary["stringMeta"] = json_res["stringMeta"]
            return cd;
        } catch (error) {
            console.warn(`[Error caught] in getCategoricalData executing: ${code}`, error);
            return cd;
        }
    }

    /**
   * Get all info for bool column
   * @param dfName 
   * @param colInfo 
   * @returns ColumnProfileData with BoolSummary
   */
    public async getBooleanData(dfName: string, colInfo: IColTypeTuple): Promise<ColumnProfileData> {
        const isIndexPy = colInfo.colIsIndex ? "True" : "False";
        const code = `digautoprofiler.getBooleanData(${dfName}, "${replaceSpecial(colInfo.colName)}", ${isIndexPy})`;

        const cd: ColumnProfileData = {
            colName: colInfo.colName,
            colType: colInfo.colType,
            colIsIndex: colInfo.colIsIndex,
            nullCount: 0,
            summary: {
                cardinality: 0,
                topK: undefined,
                summaryType: "boolean"
            },
        };

        try {
            const res = await this.executePythonAP(code);
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join(""));

            // parse info from json_res
            cd.nullCount = parseInt(json_res["nullCount"])
            cd.summary["cardinality"] = parseInt(json_res["cardinality"])
            cd.summary["topK"] = json_res["topK"]
            return cd;
        } catch (error) {
            console.warn(`[Error caught] in getCategoricalData executing: ${code}`, error);
            return cd;
        }
    }


    public async getAggrData(
        dfName: string,
        catColName: string,
        quantColName: string,
        aggrType: string,
        n = 10
    ): Promise<ValueCount[]> {
        const code = `digautoprofiler.getAggrData(${dfName}, "${replaceSpecial(catColName)}", "${replaceSpecial(quantColName)}", "${aggrType}", ${n})`;
        try {
            const res = await this.executePythonAP(code);
            const data = [];
            const content = res['content']; // might be null
            const json_res = JSON.parse(content?.join("").replace(/'/g, '\'')); // remove single quotes bc not JSON parseable
            Object.keys(json_res).forEach((k, i) => { data.push({ 'value': k, 'count': json_res[k], 'bucket': i }) });
            return data;
        } catch (error) {
            console.warn(`[Error caught] in getAggrData executing: ${code}`, error);
            return [];
        }
    }

    public async getTempAggrData(
        dfName: string,
        tempColName: string,
        quantColName: string,
        aggrType: string,
    ): Promise<BivariateTimestampInfo> {
        let code = `digautoprofiler.getTempAggrData(${dfName}, "${replaceSpecial(tempColName)}", "${replaceSpecial(quantColName)}", "${aggrType}")`;
        try {
            const res = await this.executePythonAP(code);
            const content = res['content'];
            const json_res = JSON.parse(content[0].replace(/'/g, '')); // remove single quotes bc not JSON parseable
            const response: BivariateTimestampInfo = { "data": [], "timestep": json_res["timestep"] };
            Object.keys(json_res["data"]).forEach((k, i) => { response["data"].push({ 'period': k, 'value': json_res["data"][k], 'bucket': i }); });
            return response;
        } catch (error) {
            console.warn(`[Error caught] in getTempAggrData executing: ${code}`, error);
            return { "data": [], "timestep": "Y" };
        }
    }
}