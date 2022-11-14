/**
 * Provides mappings from pandas data types to conceptual types we use in the application:
 * CATEGORICALS, NUMERICS, and TIMESTAMPS.
 */

// TODO use built in pandas type checking?

export const INTEGERS = new Set([
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'UInt8',
    'UInt16',
    'UInt32',
    'UInt64' // unclear if these are necessary
]);

export const FLOATS = new Set([
    'float',
    'float_',
    'float16',
    'float32',
    'float64'
]);

export const NUMERICS = new Set([...INTEGERS, ...FLOATS]);
export const BOOLEANS = new Set(['bool', '_bool']);
export const TIMESTAMPS = new Set(['datetime64', 'datetime64[ns]']);
export const INTERVALS = new Set([]); // TODO add pandas.Interval support
export const CATEGORICALS = new Set(['object', 'string', 'str', 'category']);

interface IColorTokens {
    textClass: string;
    bgClass: string;
    vizFillClass: string;
    vizStrokeClass: string;
    vizHoverClass?: string;
}

export const CATEGORICAL_TOKENS: IColorTokens = {
    textClass: 'text-sky-800',
    bgClass: 'bg-sky-200',
    vizFillClass: 'fill-sky-800',
    vizStrokeClass: 'fill-sky-800'
};

export const NUMERIC_TOKENS: IColorTokens = {
    textClass: 'text-red-800',
    bgClass: 'bg-red-200',
    vizFillClass: 'fill-red-300',
    vizStrokeClass: 'stroke-red-300',
    vizHoverClass: 'fill-red-400'
};

export const TIMESTAMP_TOKENS: IColorTokens = {
    textClass: 'text-teal-800',
    bgClass: 'bg-teal-200',
    vizFillClass: 'fill-teal-500',
    vizStrokeClass: 'stroke-teal-500'
};

export const INTERVAL_TOKENS: IColorTokens = TIMESTAMP_TOKENS;

function setTypeTailwindStyles(
    list: string[],
    // a tailwind class, for now.
    colorTokens: IColorTokens
) {
    return list.reduce((acc, v) => {
        acc[v] = { ...colorTokens };
        return acc;
    }, {});
}

export const DATA_TYPE_COLORS = {
    ...setTypeTailwindStyles(Array.from(CATEGORICALS), CATEGORICAL_TOKENS),
    ...setTypeTailwindStyles(Array.from(NUMERICS), NUMERIC_TOKENS),
    ...setTypeTailwindStyles(Array.from(TIMESTAMPS), TIMESTAMP_TOKENS),
    // ...setTypeTailwindStyles(Array.from(INTERVALS), INTERVAL_TOKENS),
    ...setTypeTailwindStyles(Array.from(BOOLEANS), CATEGORICAL_TOKENS)
};
