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

def getQuantMeta(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    m = colData.describe()
    print(m.to_json())

def getColMeta(dfName: pd.DataFrame, colName: str, isIndex=False):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    num_unique = colData.nunique()
    num_null = colData.isna().sum()
    print(num_unique)
    print(num_null)

def getValueCounts(dfName: pd.DataFrame, colName: str, isIndex=False, n=10):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    vc = colData.value_counts().iloc[:n]
    print(vc.to_json())

def getQuantBinnedData(dfName: pd.DataFrame, colName: str, isIndex=False, n=20):
    if isIndex:
        colData = dfName.index.to_series()
    else:
        colData = dfName[colName]
    vc = colData.value_counts(bins=min(n, colData.nunique()), sort=False)
    print(vc.to_json())

def getTempBinnedData(dfName: pd.DataFrame, colName: str, isIndex=False, n=200):
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

def getStringStats(dfName: pd.DataFrame, colName: str):
    lengths = dfName[colName].str.len()
    print(lengths.min())
    print(lengths.max())    
    print(lengths.mean()) 
