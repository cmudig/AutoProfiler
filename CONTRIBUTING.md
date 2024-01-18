# Overview of AutoProfiler development

AutoProfiler is a jupyter extension. It contains frontend typescript code and python code for executing pandas commands. These are bundled together into one jupyter extension that can be pip installed by a user.

## Frontend Code

The frontend svelte code is contained in the `src/` directory. We use the [svelte](https://learn.svelte.dev/tutorial/welcome-to-svelte) framework for components and do styling with [tailwind](https://tailwindcss.com/).

-   [`index.ts`](src/index.ts) is the entrypoint for the extension that jupyter looks at to load the extension.
-   The code roughly follows a Model, View, Controller pattern because that is how the jupyter extension examples are structured.
    -   [`ProfilePanel.ts`](src/ProfilePanel.ts) -- main wrapper that creates a [`ProfileModel`](src/dataAPI/ProfileModel.ts) and [`ProfileView`](src/components/ProfileView.ts) and listens for changes to the notebook.
    -   [`ProfileView`](src/components/ProfileView.ts) creates a [`Profiler.svelte`](src/components/Profiler.svelte) component that is the root component.
    -   [`ProfileModel`](src/dataAPI/ProfileModel.ts) handles jupyter interactions to execute python code in the kernel and listen for changes to the notebook.

## Python code

The python code is contained in the `digautoprofiler/` directory. This is mostly utility functions that are called by the frontend code to execute pandas commands and return the results, along with automatically generated jupyter extension code in the `digautoprofiler/labextension` directory (don't manually edit this).

# Development Setup and workflow

To run AutoProfiler locally you need to install as a python library that is editable.

## First time

-   You will need [NodeJS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed to build the extension package.
-   It is best to make a new conda environment before following steps (e.g. `conda create --name autoprofiler python=3.11`)

Then pip install the following:

```bash
pip install jupyterlab jupyter-packaging
```

Now download and build extension:

```bash
git clone https://github.com/cmudig/AutoProfiler.git
cd AutoProfiler
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Build Typescript source after making changes
npm run build
```

Jupyter labextension can be weird sometimes; nuking the conda env and restarting tends to fix it.

## Devloop: changes to frontend code in `src/`

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

### Terminal 1

Watch the source directory in one terminal, automatically rebuilding when changes are made to `src/`. You will need to refresh the browser to see changes.

```bash
cd AutoProfiler
npm run watch
```

**Warning**: for some reason tailwind is not automatically re-loading classes during watch mode; if you add in new classes you will need to kill and restart the watch process or run `npm run build` to see changes.

### Terminal 2

To test your code you can run a jupyter lab instance in another terminal. **Note**: this does NOT have to be in the same directory (I would encourage you to have separate testing directory); as long as the conda environment is the same, any update to the `digautoprofiler` package will be reflected in the running jupyter lab instance.

```bash
cd /path/to/your/testing/directory
conda activate autoprofiler
jupyter lab
```

## Devloop: changes to python code in `digautoprofiler/`

Changes to the python utility functions will update when the python module reloads. If you restart the kernel in jupyter, this should update the python package (you don't even have to refresh the page, just kill and restart kernel).

## Development uninstall

```bash
pip uninstall digautoprofiler
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `digautoprofiler` within that folder.
