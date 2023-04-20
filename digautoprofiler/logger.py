import logging
import os
import json
from pathlib import Path

# ensure that .autoprofiler folder exists
logPath = Path(os.path.expanduser("~")) / '.autoprofiler'
logPath.mkdir(parents=True, exist_ok=True)

# configure logger
LOGFILE = logPath / 'autoprofiler.log'
logging.basicConfig(filename=LOGFILE, filemode="a", format='%(asctime)s: %(message)s', level=logging.INFO)

def save_logs(logs):
    logging.info(json.dumps(logs))
    # with open(LOGFILE, 'a') as f:
    #     f.write(f"{datetime.datetime.now()}: {json.dumps(logs)}\n")