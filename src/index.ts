import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

import { Widget } from '@lumino/widgets';
import App from './components/App.svelte';

import { NotebookAPI } from './jupyter-hooks/notebook';
import type {IData} from './jupyter-hooks/kernel';

import {notebookStore, dfMapStore} from './stores';


// let svelteApp: App;

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
      // @ts-ignore
      const notebook = new NotebookAPI(widget);
      notebook.ready.then(() => {
        console.log('ITS ALIVE', notebook);
        
        updateUIData(notebook);
        notebook.changed.connect(async () => {
          // let variables = await notebook.kernel.getEnv();
          let dfMap = await notebook.kernel.getDataFramesWithColumns();
          updateUIData(notebook, dfMap);
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

function updateUIData(notebook?: NotebookAPI, dfMap?: IData ) {
  console.log("updating UI data...\n with notebook: ", notebook, "\n and dfMap: ",  dfMap)

  notebookStore.set(notebook); // TODO this isnt updating the store since its the same object I think
  dfMapStore.set(dfMap);

  // if (!svelteApp) {
  //   svelteApp = new App({
  //     target: widget.node,
  //     props
  //   });
  // }

}
export default plugin;
