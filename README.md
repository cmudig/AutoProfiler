# AutoProfile
Automatically profile dataframes after changes

## Install

```bash
# Clone the repo to your local environment
# Move to codegen directory

# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension install .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```
