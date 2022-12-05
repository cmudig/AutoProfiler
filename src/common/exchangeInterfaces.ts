//  types for store set on notebook re-run
export type IColTypeTuple = {
    col_name: string;
    col_type: string;
};

export type Warning = {
    warnMsg: string;
}

export type IDFColMap = {
    [key: string]: {
        columns: IColTypeTuple[];
        python_id: string;
        warnings?: Warning[]
    };
};

// data fetched from kernel for frontend
export type IDFProfileWStateMap = {
    [dfname: string]: IDFProfileWState;
} | undefined;


export type IDFProfileWState = IDFProfileData & IDFProfileState

export type IDFProfileState = {
    lastUpdatedTime: number;
    isPinned: boolean;
    warnings?: Warning[]
}

export type IDFProfileData = {
    profile: ColumnProfileData[];
    shape: number[];
    dfName: string;
}

export type IQuantChartData = {
    binned_data: any[];
    bin_size: number;
};

export type IQuantMeta = {
    min: number;
    q25: number;
    q50: number;
    q75: number;
    max: number;
    mean: number;
};

export type IColMeta = {
    numUnique: number;
    nullCount: number;
};

export type ColumnProfileData = {
    name: string;
    type: string;
    summary: ColumnSummary;
    nullCount: number;
    example: any;
};

export interface ColumnSummary {
    cardinality: number; // num unique
    topK: ValueCount[];
    histogram?: IHistogram;
    statistics?: IQuantMeta;
    timeSummary?: TimeColumnSummary;
}

// TODO this could be subclass but then need better type guards
export interface TimeColumnSummary {
    interval: Interval;
    rollup: {
        results: TimeBin[];
        spark: TimeBin[];
        timeRange: {
            start: Date;
            end: Date;
            interval: Interval;
        };
    };
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
