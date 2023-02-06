"""
Utility functions for calculating metadata from pandas dataframes
These are called from PythonExecutor.ts in the frontend
"""

import pandas as pd
import numpy as np


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

def getStringStats(dfName: pd.DataFrame, colName: str):
    lengths = dfName[colName].str.len()
    colData = dfName[colName]
    vc = colData.value_counts()
    bottom_n = vc.iloc[-5:]
    bottom_mean = bottom_n.mean()
    top_n = vc.iloc[:5]
    top_mean = top_n.mean()
    #after add the value counts for each thing
    #make the n variable
    print(lengths.min())
    print(lengths.max())    
    print(lengths.mean())
    print(bottom_mean)
    print(top_mean)


def getNumericalStats(dfName:pd.DataFrame,colName:str):
    sd = dfName[colName].describe().loc['std']
    mean = dfName[colName].describe().loc['mean']
    update = (dfName[colName] - mean)/sd
    sd_out1 = update.loc[lambda x:(x < -2.5)]
    sd_out2 = update.loc[lambda x:(x > 2.5)]
    q3 =dfName[colName].describe().loc['75%']
    q1 =dfName[colName].describe().loc['25%']
    iqr = q3-q1
    lower = q1-1.5*iqr
    upper = q3+1.5*iqr
    iqr_out1 = dfName[colName].loc[lambda x: (x < lower)]
    iqr_out2 = dfName[colName].loc[lambda x: (x > upper)]
    sd_num_outliers = len(sd_out2) + len(sd_out1)
    iqr_num_outliers = len(iqr_out2) + len(iqr_out1)

    column = dfName[colName].dropna()
    prev = column[:1][1]
    ascending = 0
    descending = 0
    for item in column[1:]:
        if item >= prev:
            ascending+=1
        else: 
            descending+=1
    status= ""
    proportion = (ascending/(ascending+descending))
    if proportion == 1:
        status = "ascending"
    elif proportion == 0:
        status = "descending"
    elif ((ascending/(ascending+descending)) > 0.7):
        status= "mostly ascending"
    elif ((ascending/(ascending+descending))>0.3):
        status = "a mix of both ascending and descending values"
    else:
        status ="mostly descending"
    zero = len(dfName[colName].loc[lambda x: (x == 0)])
    negative = len(dfName[colName].loc[lambda x: (x < 0)])
    positive = len(dfName[colName].loc[lambda x: (x > 0)])
    print(sd_num_outliers)
    print(iqr_num_outliers)
    print(status)
    print(zero)
    print(negative)
    print(positive)

def getTemporalFacts(dfName:pd.DataFrame,colName:str):
    if (dfName[colName].is_monotonic):
        result = "The dataframe is sorted with respect to time."
    else:
        result = "The dataframe is not sorted with respect to time."
    print(result)