"""
Utility functions for calculating metadata from pandas dataframes
These are called from PythonExecutor.ts in the frontend
"""

import pandas as pd

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


def getColMeta(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    num_unique = colData.nunique()
    num_null = colData.isna().sum()
    print(num_unique)
    print(num_null)

def getValueCounts(dfName: pd.DataFrame, colName: str, n=10, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    vc = colData.value_counts().iloc[:n]
    print(vc.to_json())

def getQuantBinnedData(dfName: pd.DataFrame, colName: str, n=20, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    vc = colData.value_counts(bins=min(n, colData.nunique()), sort=False)
    print(vc.to_json())

def getTempBinnedData(dfName: pd.DataFrame, colName: str, n=200, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    vc = (colData.astype("int64")//1e9).value_counts(bins=min(n, colData.nunique()), sort=False)
    true_min = (colData.astype("int64")//1e9).min()
    print(vc.to_json())
    print(true_min)

def getTempInterval(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    timerange = colData.max() - colData.min()
    print(timerange.days)

def getVariableNamesInPythonStr(codeString: str):
    import tokenize, io

    print(set([ t.string for t in tokenize.generate_tokens(io.StringIO(codeString).readline) if t.type == 1]))

def getStringMeta(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        lengths = dfName.index.to_series().str.len()
    else:
        lengths = dfName[colName].str.len()
    print(lengths.min())
    print(lengths.max())    
    print(lengths.mean())

def getQuantMeta(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    
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
        status = "ascending"
    elif colData.is_monotonic_decreasing:
        status = "descending"
    else:
        status = "noSort"
    
    n_zero = sum(colData == 0)
    n_negative = sum(colData < 0)
    n_positive = sum(colData > 0)
    
    print(describe.to_json())
    print(sd_num_outliers)
    print(iqr_num_outliers)
    print(status)
    print(n_zero)
    print(n_negative)
    print(n_positive)


def getTemporalMeta(dfName:pd.DataFrame, colName:str, isIndex=False):
    if isIndex:
        colData = dfName.index
    else:
        colData = dfName[colName]

    if colData.is_monotonic_increasing:
        result = "ascending"
    elif colData.is_monotonic_decreasing:
        result = "descending"
    else:
        result = "noSort"
    print(result)