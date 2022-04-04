import type { ISessionContext } from '@jupyterlab/apputils';
/**
 * Simplified adaption of https://github.com/lckr/jupyterlab-variableInspector
 */
export default class KernelAPI {
    session: ISessionContext;
    constructor(session: ISessionContext);
    get language(): Promise<string>;
    get name(): string;
    get ready(): Promise<void>;
    getEnv(): Promise<{
        names: string[];
        types: string[];
    }>;
    getDataFramesWithColumns(): Promise<{}>;
    runCode(code: string, onReply?: (type: string, content: any) => void, onDone?: (string?: any) => void): void;
    private getVariableNames;
    private getType;
    private getDFVars;
    private getColumns;
    private parseDtypes;
}
