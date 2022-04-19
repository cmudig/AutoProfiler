import type {
    IDFColMap,
    IQuantMeta, INomMeta, 
    IQuantChartData,
    INomChartData
} from "./exchangeInterfaces"

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