"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Simplified adaption of https://github.com/lckr/jupyterlab-variableInspector
 */
class KernelAPI {
    session;
    constructor(session) {
        this.session = session;
    }
    get language() {
        return this.session.session.kernel.info.then(infoReply => {
            return infoReply.language_info.name;
        });
    }
    get name() {
        return this.session.kernelDisplayName;
    }
    // ready is a Promise that resolves once the kernel is ready to use
    get ready() {
        return this.session.ready;
    }
    async getEnv() {
        // make sure kernel is ready to run code
        await this.ready;
        // first get the variable names
        let var_names = await this.getVariableNames();
        // then get the variable types
        if (var_names) {
            let var_types = await this.getType(var_names);
            return { names: var_names, types: var_types };
        }
    }
    async getDataFramesWithColumns() {
        await this.ready;
        let var_names = await this.getVariableNames();
        if (var_names) {
            let isDF = await this.getDFVars(var_names);
            let vars_DF = var_names.filter((d, idx) => isDF[idx] === "True");
            console.log("The dataframes in memory are: ", vars_DF);
            if (vars_DF) {
                // TODO update this to async so more reactive https://zellwk.com/blog/async-await-in-loops/
                let dfColMap = {}; // str : [str, str] tuple
                for (let index = 0; index < vars_DF.length; index++) {
                    let columns = await this.getColumns(vars_DF[index]);
                    // columns is array of strings
                    let columnTuples = columns.map(txt => this.parseDtypes(txt)).filter(txt => (txt != undefined));
                    dfColMap[vars_DF[index]] = columnTuples;
                }
                console.log("dfCOlMap is: ", dfColMap);
                return dfColMap;
            }
        }
    }
    runCode(code, onReply, onDone) {
        let future = this.session.session.kernel.requestExecute({
            code,
            stop_on_error: true
        });
        // this is the output of the execution, may return things multiple times as code runs
        future.onIOPub = msg => {
            var msg_type = msg.header.msg_type;
            if (msg_type === 'execute_result' ||
                msg_type === 'stream' ||
                msg_type === 'display_data')
                if (onReply)
                    onReply(msg_type + '', msg.content);
        };
        // when execution is done
        future.done.then(reply => {
            // console.log(
            //   'Code execution finished with status: ',
            //   reply.content.status
            // );
            if (onDone)
                onDone(reply.content.status);
        }, error => {
            console.error('Code run failed: ', error);
            if (onDone)
                onDone();
        });
    }
    async getVariableNames() {
        let code = '%who_ls'; // a python magic command
        return new Promise(resolve => {
            let onReply = (type, content) => {
                if (type == 'execute_result') {
                    // parse data into usable format
                    let data = (content.data['text/plain'] + '').replace(/'/g, '"');
                    let jsn = `{"names": ${data}}`;
                    let names = JSON.parse(jsn).names;
                    // return variable names
                    resolve(names);
                }
            };
            /**
             * @type {Promise<void>}
             */
            // let onDone = (new Promise<void>(resolve => resolve())); // () => resolve(); // missing args or something?
            this.runCode(code, onReply);
        });
    }
    async getType(varNames) {
        let code_lines = [];
        varNames.forEach(name => code_lines.push(`print(type(${name}).__name__)`));
        return new Promise(resolve => {
            let onReply = (type, content) => {
                if (type === 'stream') {
                    // get types in a usable format
                    let response = content.text.split('\n');
                    response.pop();
                    // return types
                    resolve(response);
                }
            };
            // let onDone = () => resolve();
            this.runCode(code_lines.join('\n'), onReply);
        });
    }
    getDFVars(varNames) {
        /*
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code_lines = ['import pandas as pd']; // TODO better way to make sure pandas in env?
        varNames.forEach(name => code_lines.push(`print(type(${name}) == pd.DataFrame)`));
        return new Promise(resolve => {
            let onReply = (type, content) => {
                if (type === 'stream') {
                    // get types in a usable format
                    let response = content.text.split('\n');
                    response.pop();
                    // return types
                    resolve(response);
                }
            };
            this.runCode(code_lines.join('\n'), onReply);
        });
    }
    getColumns(varName) {
        /*
        varNames is array of variables that are pd.DataFrame
        Returns array of "True" or "False" if that variable is a pandas dataframe
        */
        let code = `print(${varName}.dtypes)`;
        return new Promise(resolve => {
            let onReply = (type, content) => {
                if (type === 'stream') {
                    // get types in a usable format
                    let response = content.text.split('\n');
                    response.pop();
                    // return types
                    resolve(response);
                }
            };
            this.runCode(code, onReply);
        });
    }
    parseDtypes(s) {
        if (s !== "dtype: object") {
            return s.split(/\s+/);
        }
    }
}
exports.default = KernelAPI;
//# sourceMappingURL=kernel.js.map