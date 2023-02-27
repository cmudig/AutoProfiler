import pandas as pd

def convertVC(vc: pd.Series, colName: str):
    return vc.reset_index().rename( 
        columns={"index": "value", 
        colName: "count"}).to_dict('records')

def convertDescribe(statistics: pd.Series):
    s = statistics.to_dict()

    return {
        "min": s["min"],
        "q25": s["25%"],
        "q50": s["50%"],
        "q75": s["75%"],
        "max": s["max"],
        "mean": s["mean"],
    }

def convertBinned(numVC: pd.Series, true_min):
    """
    numVC has interval index from binned value counts. Replace far left low 
    with true min because pandas cuts below min
    """
    d = pd.DataFrame(
        {"low": numVC.index.left,
         "high": numVC.index.right,
         "count": numVC.values
        })
    d = d.reset_index().rename(columns={"index": "bucket"})
    d_dict = d.to_dict('records')

    if len(d_dict) > 0:
        d_dict[0]['low'] = true_min
    
    return d_dict