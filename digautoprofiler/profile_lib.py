"""
Utility functions for calculating metadata from pandas dataframes
These are called from PythonExecutor.ts in the frontend
"""

import json
import pandas as pd
from .utils import convertDescribe, convertBinned, convertVC


######## External functions #######
def getColumns(dfName: pd.DataFrame):
    typeDF = dfName.dtypes.reset_index().rename(columns={"index": "colName", 0: "type"})
    typeDF["isIndex"] = False
    if dfName.index.name:
        name = dfName.index.name
    else:
        name = ""
    indexDF = pd.DataFrame({"colName": [name], "type": [dfName.index.dtype]})
    indexDF["isIndex"] = True
    typeDF = pd.concat([indexDF, typeDF])
    print(typeDF.to_json(orient="records", default_handler=str))

def getShape(dfName: pd.DataFrame):
    print(dfName.shape)

def getVariableNamesInPythonStr(codeString: str):
    import tokenize, io
    print(set([ t.string for t in tokenize.generate_tokens(io.StringIO(codeString).readline) if t.type == 1]))


def getNumericData(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]

    # get data
    nullCount = getNullCount(colData)
    
    # all nulls
    if nullCount == colData.shape[0]:
        data = {
            "nullCount": nullCount,
            "histogram": [],
            "quantMeta": None
        }
        jsonString = json.dumps(data, default=str)
        print(jsonString)
        return

    quantMetaDict = getQuantMeta(colData)
    chartData = getQuantBinnedData(colData)
    chartData = convertBinned(chartData, quantMetaDict["min"])

    # construct and serialise
    # should match NumericSummary
    data = {
        "nullCount": nullCount,
        "histogram": chartData,
        "quantMeta": quantMetaDict
    }

    jsonString = json.dumps(data, default=str)
    print(jsonString)
    
def getTemporalData(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]

    nullCount = getNullCount(colData)

    if nullCount == colData.shape[0]:
        data = {
            "nullCount": nullCount,
            "histogram": [],
            "timeInterval": None,
            "temporalMeta": None
        }
        jsonString = json.dumps(data, default=str)
        print(jsonString)
        return

    vc, true_min = getTempBinnedData(colData)
    interval = getTempInterval(colData)
    temporalMeta = getTemporalMeta(colData)

    # convert to JSON serializable
    histogram = convertBinned(vc, true_min)

    # should match TemporalSummary
    data = {
        "nullCount": nullCount,
        "histogram": histogram,
        "timeInterval": interval,
        "temporalMeta": temporalMeta
    }

    jsonString = json.dumps(data, default=str)
    print(jsonString)

def getCategoricalData(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]

    nullCount = getNullCount(colData)

    if nullCount == colData.shape[0]:
        data = {
            "nullCount": nullCount,
            "cardinality": 0,
            "topK": None,
            "stringMeta": None
        }
        jsonString = json.dumps(data, default=str)
        print(jsonString)
        return

    numUnique = getNumUnique(colData)
    vc = getValueCounts(colData)
    stringMeta = getStringMeta(colData)

    # convert to JSON serializable
    topK = convertVC(vc, colName)
    
    # should match CategoricalSummary
    data = {
        "nullCount": nullCount,
        "cardinality": numUnique,
        "topK": topK,
        "stringMeta": stringMeta
    }

    jsonString = json.dumps(data, default=str)
    print(jsonString)

def getBooleanData(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]

    nullCount = getNullCount(colData)

    if nullCount == colData.shape[0]:
        data = {
            "nullCount": nullCount,
            "cardinality": 0,
            "topK": None,
        }
        jsonString = json.dumps(data, default=str)
        print(jsonString)
        return
    numUnique = getNumUnique(colData)
    vc = getValueCounts(colData)

    # convert to JSON serializable
    topK = convertVC(vc, colName)
    
    # should match CategoricalSummary
    data = {
        "nullCount": nullCount,
        "cardinality": numUnique,
        "topK": topK,
    }

    jsonString = json.dumps(data, default=str)
    print(jsonString)
    

######## Internal functions #######
def getNullCount(colData: pd.Series):
    return colData.isna().sum()

def getNumUnique(colData: pd.Series):
    return colData.nunique()

def getValueCounts(colData: pd.Series, n=10):
    vc = colData.value_counts().iloc[:n]
    return vc

def getQuantBinnedData(colData: pd.Series, n=20):
    vc = colData.value_counts(bins=min(n, colData.nunique()), sort=False)
    return vc

def getTempBinnedData(colData: pd.Series, n=200):
    vc = (colData.astype("int64")//1e9).value_counts(bins=min(n, colData.nunique()), sort=False)
    true_min = (colData.astype("int64")//1e9).min()
    return vc, true_min

def getTempInterval(colData: pd.Series):
    timerange = colData.max() - colData.min()
    return {"months": 0, "days": timerange.days, "micros": 0}

def getStringMeta(colData: pd.Series):
    lengths = colData.str.len()

    return {
        "minLength": lengths.min(),
        "maxLength": lengths.max(),
        "meanLength": lengths.mean(),
    }

def getQuantMeta(colData: pd.Series): 
    describe = colData.describe()
    sd = describe.loc['std']
    mean = describe.loc['mean']
    q3 = describe.loc['75%']
    q1 = describe.loc['25%']

    # get num outliers > 3 std away from mean
    normalized = (colData - mean) / sd
    sd_num_outliers = sum( abs(normalized) > 3)

    # get iqr outliers that are 1.5 * iqr away from q1 or q3
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    iqr_num_outliers = sum((colData < lower) | (colData > upper))

    # get sortedness
    if colData.is_monotonic_increasing:
        sortedness = "ascending"
    elif colData.is_monotonic_decreasing:
        sortedness = "descending"
    else:
        sortedness = "noSort"
    
    n_zero = sum(colData == 0)
    n_negative = sum(colData < 0)
    n_positive = sum(colData > 0)

    # make serializable
    statistics = convertDescribe(describe)
    statistics["sd_outlier"] = sd_num_outliers
    statistics["iqr_outlier"] = iqr_num_outliers
    statistics["sortedness"] = sortedness
    statistics["n_zero"] = n_zero
    statistics["n_positive"] = n_positive
    statistics["n_negative"] = n_negative

    return statistics

def getTemporalMeta(colData: pd.Series):
    if colData.is_monotonic_increasing:
        result = "ascending"
    elif colData.is_monotonic_decreasing:
        result = "descending"
    else:
        result = "noSort"
    return {"sortedness": result}