# Troubleshooting

Installing Jupyter extensions can be tricky, these are some common issues we've run into. If your issue isn't covered here please [open an issue](https://github.com/cmudig/AutoProfiler/issues) in the repo and we'll try to help you out.

### How do I load this into a fresh conda env?

```bash
conda create -n autoprofiler-env python
conda activate digautoprofiler-env
pip install digautoprofiler
```

### Why isn't anything showing up?

After pip installing, if you're not seeing AutoProfiler in the left side bar then the extension was not installed properly. Jupyter reads extensions from a directory wherever it is installed.

Check 1: Run the command below in your terminal.

```bash
jupyter labextension list
```

All of your extensions should list in the terminal like

```bash
digautoprofiler v0.1.1 enabled OK (python, digautoprofiler)
```

If this is not showing, then the extension did not install to the same location that jupyter is looking for. One way to check this is to run

```bash
which jupyter
which pip
```

These should point to the same conda env if you're using conda. For example, if you made the conda env from earlier in the troubleshooting then it might be `~/opt/anaconda3/envs/digautoprofiler-env/bin/`

Check 2: Another way to make sure the extension is installed is to run jupyter and then click on the puzzle piece in the left side bar. This shows all your activate extensions. These should be allowed to run and digautoprofiler should be listed.
