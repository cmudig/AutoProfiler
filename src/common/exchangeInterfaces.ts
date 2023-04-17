export type IColTypeTuple = {
    colName: string;
    colType: string;
    colIsIndex: boolean;
};

export type Warning = {
    warnMsg: string;
}

export type IDFColMap = {
    [key: string]: {
        columns: IColTypeTuple[];
        python_id: string;
        warnings: Warning[]
    };
};

// data fetched from kernel for frontend
export type IDFProfileWStateMap = {
    [dfname: string]: IDFProfileWState;
} | undefined;


export type IDFProfileData = {
    profile: ColumnProfileData[];
    shape: number[];
    dfName: string;
}


export type IDFProfileState = {
    lastUpdatedTime: number;
    isPinned: boolean;
    warnings: Warning[]
}

export type IDFProfileWState = IDFProfileData & IDFProfileState

export type ColumnProfileData = IColTypeTuple & {
    nullCount: number,
    summary: AnySummary;
}

export type AnySummary = NumericSummary | CategoricalSummary | BoolSummary | TemporalSummary;

export type NumericSummary = {
    summaryType: "numeric";
    histogram: IHistogram;
    quantMeta: IQuantMeta;
}

export type CategoricalSummary = { // string or boolean
    summaryType: "categorical";
    cardinality: number; // num unique
    topK: ValueCount[];
    stringMeta: IStringMeta;
}

export type BoolSummary = { // string or boolean
    summaryType: "boolean";
    cardinality: number; // num unique
    topK: ValueCount[];
}

export type TemporalSummary = {
    summaryType: "temporal";
    histogram: IHistogram;
    timeInterval: Interval;
    temporalMeta: ITemporalMeta;
}

// type guards
export function isNumericSummary(s: AnySummary): s is NumericSummary {
    return (s as NumericSummary).summaryType === "numeric"
}

export function isCategoricalSummary(s: AnySummary): s is CategoricalSummary {
    return (s as CategoricalSummary).summaryType === "categorical"
}

export function isBooleanSummary(s: AnySummary): s is BoolSummary {
    return (s as BoolSummary).summaryType === "boolean"
}

export function isTemporalSummary(s: AnySummary): s is TemporalSummary {
    return (s as TemporalSummary).summaryType === "temporal"
}

// ~~~~~~~ Individual data type info ~~~~~~~
export type IQuantMeta = {
    min: number;
    q25: number;
    q50: number;
    q75: number;
    max: number;
    mean: number;
    sd_outlier: number;
    iqr_outlier: number;
    sortedness: string;
    n_zero: number;
    n_positive: number;
    n_negative: number;
};

export type IStringMeta = {
    minLength: number;
    maxLength: number;
    meanLength: number;
};

export type ITemporalMeta = {
    sortedness: string;
}

export type TimeBin = {
    count: number;
    ts_start: Date;
    ts_end: Date;
};

export type ValueCount = {
    value: any;
    count: number;
};

export type IHistogramBin = {
    bucket: number;
    low: number;
    high: number;
    count: number;
};

export type IHistogram = IHistogramBin[];

export type Interval = {
    months: number;
    days: number;
    micros: number;
};

export enum PreviewRollupInterval {
    ms = '1 millisecond',
    second = '1 second',
    minute = '1 minute',
    hour = '1 hour',
    day = '1 day',
    month = '1 month',
    year = '1 year'
}
