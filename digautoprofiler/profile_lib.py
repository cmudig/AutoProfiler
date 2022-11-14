"""
Utility functions for calculating metadata from pandas dataframes
These are called from PythonExecutor.ts in the frontend
"""

import pandas as pd


def getColumns(dfName: pd.DataFrame):
    print(dfName.dtypes.to_json(default_handler=str))

def getShape(dfName: pd.DataFrame):
    print(dfName.shape)

def getQuantMeta(dfName: pd.DataFrame, colName: str):
    m = dfName[colName].describe()
    print(m.to_json())

def getColMeta(dfName: pd.DataFrame, colName: str):
    num_unique = dfName[colName].nunique()
    num_null = dfName[colName].isna().sum()
    print(num_unique)
    print(num_null)

def getValueCounts(dfName: pd.DataFrame, colName: str, n=10):
    vc = dfName[colName].value_counts().iloc[:n]
    print(vc.to_json())

def getQuantBinnedData(dfName: pd.DataFrame, colName: str, n=20):
    vc = dfName[colName].value_counts(bins=min(n, dfName[colName].nunique()), sort=False)
    print(vc.to_json())

def getTempBinnedData(dfName: pd.DataFrame, colName: str, n=200):
    vc = (dfName[colName].astype("int64")//1e9).value_counts(bins=min(n, dfName[colName].nunique()), sort=False)
    true_min = (dfName[colName].astype("int64")//1e9).min()
    print(vc.to_json())
    print(true_min)

def getTempInterval(dfName: pd.DataFrame, colName: str):
    timerange = dfName[colName].max() - dfName[colName].min()
    print(timerange.days)

def getVariableNamesInPythonStr(codeString: str):
    import tokenize, io

    print(set([ t.string for t in tokenize.generate_tokens(io.StringIO(codeString).readline) if t.type == 1]))
