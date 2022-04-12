import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import Stage from './components/Stage.svelte';
import { NotebookAPI } from './dataAPI/jupyter/notebook'
// import { JupyterPandasExecutor } from "./dataAPI/DataWrapper";

import { dataAccessor } from './stores';
import { get } from 'svelte/store';

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
  new Stage({
    target: widget.node
  });

  return widget
}

function updateUIData(notebook: NotebookAPI) {
  // console.log("resetting data accessor object with notebook: ", notebook)

  const da = get(dataAccessor)

  if (!da.initialized) {
    console.log("da not yet init...")

    if (notebook.panel.sessionContext) {
      da.init(notebook.panel.sessionContext)
    } else {
      console.log("...but no session context so not doing anything.")
    }

  } else {
    console.log("da already init.")
  }

  // if (notebook.panel.sessionContext) {

  //   if (!da.initialized) {
  //     console.log("initializing da...")
  //     da.init(notebook.panel.sessionContext)
  //   } else {
  //     // use store update function or something?
  //   }

  // }
 

  // dataAccessor.set(da)
  // initialLoad.set(true)

}


export default plugin;
