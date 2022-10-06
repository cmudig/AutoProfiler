# AutoProfile

Profile your Pandas Dataframes! Autoprofiler will automatically visualize your Pandas dataframes after every execution, no extra code necessary.

Autoprofiler shows you things like:

-   Distribution of each column
-   Sample values
-   Summary statistics

![screenshot of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/profiler_sc.png)

## Updates profiles as your data updates

Autoprofiler reads your current Jupyter notebook and produces profiles for the Pandas Dataframes in your memory as they change.

![demo of autoprofile](https://raw.githubusercontent.com/cmudig/AutoProfile/main/.github/screenshots/demo.gif)

## Requirements

-   JupyterLab >= 3.0
-   Pandas

## Install

```bash
pip install digautoprofile
```

For development install instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

If you're having install issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Acknowledgements

Big thanks to the Rill Data team! Much of our profiler UI code is from [Rill Developer](https://github.com/rilldata/rill-developer).
