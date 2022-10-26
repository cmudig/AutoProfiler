# AutoProfiler

[![PyPi](https://img.shields.io/pypi/v/digautoprofile.svg)](https://pypi.org/project/digautoprofile/)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/cmudig/AutoProfile/HEAD?labpath=examples%2FSF%20Housing%20Demo.ipynb)
[![Lite](https://gist.githubusercontent.com/willeppy/35cdc20a3fc26e393ce76f1df35bcdfc/raw/a7fca1d0a2d62c2b49f60c0217dffbd0fe404471/lite-badge-launch-small.svg)](http://dig.cmu.edu/AutoProfile)

Profile your [Pandas](https://pandas.pydata.org) Dataframes! Autoprofiler will automatically visualize your Pandas dataframes after every execution, no extra code necessary.

Autoprofiler allows you to spend less time specifying charts and more time interacting with your data by automatically showing you profiling information like:

-   Distribution of each column
-   Sample values
-   Summary statistics


## Updates profiles as your data updates
![screenshot of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/profiler_sc.png)

Autoprofiler reads your current Jupyter notebook and produces profiles for the Pandas Dataframes in your memory as they change.

![demo of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/demo.gif)

## Install

To instally locally use pip and then open a jupyter notebook and the extension will be running.
```bash
pip install -U digautoprofile
```

## Try it out

To try out Autoprofiler in a hosted notebook, use one of the options below

|Jupyter Lite|Binder|
|:---:|:---:|
|[![Lite](https://gist.githubusercontent.com/willeppy/35cdc20a3fc26e393ce76f1df35bcdfc/raw/a7fca1d0a2d62c2b49f60c0217dffbd0fe404471/lite-badge-launch-small.svg)](http://dig.cmu.edu/AutoProfile) | [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/cmudig/AutoProfile/HEAD?labpath=examples%2FSF%20Housing%20Demo.ipynb) |

## Requirements

-   JupyterLab >= 3.0
-   Pandas


For development install instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

If you're having install issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Acknowledgements

Big thanks to the Rill Data team! Much of our profiler UI code is from [Rill Developer](https://github.com/rilldata/rill-developer).
