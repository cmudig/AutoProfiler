
export type IColTypeTuple = {
    "col_name": string,
    "col_type": string
}

export type IDFColMap = {
    [key: string]:
    {
        "columns": IColTypeTuple[],
        "python_id": string
    }
}

export type IQuantChartData = { 
    "binned_data": any[], 
    "bin_size": number 
}

export type IQuantMeta = {
    "min": number,
    "q25": number,
    "q50": number,
    "q75": number,
    "max": number,
    "mean": number,
}

export type IColMeta = {
    "numUnique": number,
    "nullCount": number,
}

export type ColumnProfileData = {
    "name": string,
    "type": string,
    "summary": ColumnSummary,
    "nullCount": number,
    "example": any,
}

export type ColumnSummary = {
    "cardinality": number, // num unique
    "topK": ValueCount[],
    "histogram"?: IHistogram,
    "statistics"?: IQuantMeta,
    interval?: Interval,
    estimatedSmallestTimeGrain?: string
}

export type ValueCount = {
    "value": any,
    "count": number,
}

export type IHistogramBin = {
    "bucket": number,
    "low": number,
    "high": number,
    "count": number,
}

export type IHistogram = IHistogramBin[]

export type Interval = {
    "months": number,
    "days": number,
    "micros": number,
}

// // executor interface for ArqueroExecutor below
// export interface Executor {
//     // getColumn(colName: string): Promise<any>,
//     // getColumns(): Promise<string[]>, // TODO rename to column names
//     // getColumnTypes(): Promise<{ [colName: string]: string }>,

//     // get rid of these through a different abstraction somehow...
//     language: Promise<string> | undefined,
//     name: string,
//     ready: Promise<void>,

//     getShape(dfName: string): Promise<number[]>,
//     getAllDataFrames(): Promise<IDFColMap>,
//     getColHeadRows(dfName: string, colName: string, n?: number): Promise<string[]>,
//     getNomMeta(dfName: string, colName: string): Promise<INomMeta>,
//     getQuantMeta(dfName: string, colName: string): Promise<IQuantMeta>,
//     getNomColVisData(colName: string, n?: number): Promise<INomChartData>,
//     getQuantBinnedData(colName: string, maxbins?: number): Promise<IQuantChartData>,
// }