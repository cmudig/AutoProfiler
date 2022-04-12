import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import App from './components/App.svelte';
import { NotebookAPI } from './dataAPI/jupyter/notebook'
import {JupyterPandasExecutor} from "./dataAPI/DataWrapper";

import {dataAccessor} from './stores';

/**
 * Initialization data for the AutoProfile extension.
 */

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'AutoProfile:plugin',
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
  ) => {

    console.log("Activating AutoProfile extension...")

    buildUI(app);

    notebookTracker.currentChanged.connect((_, widget) => {
      
      const notebook = new NotebookAPI(widget);
      notebook.ready.then(() => {
        console.log('Notebook ready! ---', notebook);

        updateUIData(notebook);
        notebook.changed.connect(async () => {
          
          // let dataframes_with_columns = await notebook.kernel.getDataFramesWithColumns();
          updateUIData(notebook);
        });
      });
    });

  },
  requires: [INotebookTracker],
};

function buildUI(app: JupyterFrontEnd) {

  // widget setup
  const widget = new Widget();
  widget.addClass('AutoProfileApp');
  widget.id = 'auto-profile-app';
  widget.title.caption = 'AutoProfile';
  widget.title.label = "AutoProfile"
  widget.title.iconClass = 'jp-SideBar-tabIcon myIcon';
  app.shell.add(widget, 'left', { rank: 600 });

  // make svelte component
  new App({
    target: widget.node
  });

  return widget
}

function updateUIData(notebook: NotebookAPI) {
  console.log("resetting data accessor object with notebook: ", notebook)

  // TODO this is inefficient, should not make a new object on every update...
  let da = new JupyterPandasExecutor(notebook.panel.sessionContext)

  dataAccessor.set(da)

}


export default plugin;
