# AutoProfile

[![PyPi](https://img.shields.io/pypi/v/digautoprofile.svg)](https://pypi.org/project/digautoprofile/)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/cmudig/AutoProfile/HEAD?labpath=examples%2FSF%20Housing%20Demo.ipynb)

Profile your [Pandas](https://pandas.pydata.org) Dataframes! Autoprofiler will automatically visualize your Pandas dataframes after every execution, no extra code necessary.

Autoprofiler shows you things like:

-   Distribution of each column
-   Sample values
-   Summary statistics
-   And more!

## Install

To instally locally use pip:
```bash
pip install -U digautoprofile
```

Or you can try out a hosted notebook with `digautoprofile` pre-installed on binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/cmudig/AutoProfile/HEAD?labpath=examples%2FSF%20Housing%20Demo.ipynb)


## Updates profiles as your data updates
![screenshot of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/profiler_sc.png)

Autoprofiler reads your current Jupyter notebook and produces profiles for the Pandas Dataframes in your memory as they change.

![demo of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/demo.gif)

## Requirements

-   JupyterLab >= 3.0
-   Pandas


For development install instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

If you're having install issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Acknowledgements

Big thanks to the Rill Data team! Much of our profiler UI code is from [Rill Developer](https://github.com/rilldata/rill-developer).
