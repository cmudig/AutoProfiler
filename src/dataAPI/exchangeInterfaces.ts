
export type IColTypeTuple = { "col_name": string, "col_type": string }
export type IDFColMap = { [key: string]: IColTypeTuple[] }

export type IQuantChartData = {"binned_data": any[], "bin_size": number}
export type INomChartData = any[]

// export type IColMeta = {"num_unique": string, "num_invalid": string }

// TODO add string to these types to be able to ref later
export type IQuantMeta = {
    "mean": string,
    "median": string,
    "num_invalid": string,
}

export type INomMeta = {
    "num_unique": string,
    "num_invalid": string,
}

export type ColumnProfileData = {
    "name": string,
    "type": string,
    "summary": {
        "cardinality": number,
        "histogram": {
            "length": number
        }
        "topK": any[]
        "statistics": {
            "min": number,
            "q25": number,
            "q50": number,
            "q75": number,
            "max": number,
            "mean": number,
        }
    }
    "nullCount": number,
    "example": any,
}