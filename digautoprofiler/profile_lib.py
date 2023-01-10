"""
Utility functions for calculating metadata from pandas dataframes
These are called from PythonExecutor.ts in the frontend
"""

import pandas as pd
import numpy as np
import re
from collections import Counter
import nltk


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
    
def getNgrams(dfName: pd.DataFrame, colName: str, n=10):
    stopwords = {"ourselves", "hers", "between", "yourself", "but", "again", "there", "about", "once", 
        "during", "very", "with", "own", "an", "posting", "post", "resim", "hide", "restore", "this", 
        "for", "in", "and", "to", "the", "a", "of", "is" }
    
    documents = dfName[colName].dropna().apply(
        lambda entry: " ".join([text for text in (nltk.word_tokenize(re.sub("[^0-9a-zA-Z_ ]", " ", str(entry)).lower())) if text not in stopwords])
        ).tolist()
    unigram = []
    bigram = []
    trigram = []
    for string in documents:
        document = string.split(" ")
        length = len(document)
        for i in range(length):
            unigram.append(" ".join(document[i:i+1]))
            if (i <= length-2):
                bigram.append(" ".join(document[i:i+2]))
            if (i <= length-3):
                trigram.append(" ".join(document[i:i+3]))
    unilen = len(unigram)
    bilen = len(bigram)
    trilen = len(trigram)
    uni = pd.Series(dict(Counter(unigram).most_common(n)))
    bi = pd.Series(dict(Counter(bigram).most_common(n)))
    tri = pd.Series(dict(Counter(trigram).most_common(n)))
    print(unilen)
    print(bilen)
    print(trilen)
    print(uni.to_json())
    print(bi.to_json())
    print(tri.to_json())

def getVariableNamesInPythonStr(codeString: str):
    import tokenize, io

    print(set([ t.string for t in tokenize.generate_tokens(io.StringIO(codeString).readline) if t.type == 1]))

def getStringStats(dfName: pd.DataFrame, colName: str):
    lengths = dfName[colName].str.len()
    print(lengths.min())
    print(lengths.max())    
    print(lengths.mean()) 
