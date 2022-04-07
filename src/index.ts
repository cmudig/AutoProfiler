import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

import { Widget } from '@lumino/widgets';
import App from './components/App.svelte';

import { NotebookAPI } from './jupyter-hooks/notebook';


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

    let myUI = buildUI(app);

    notebookTracker.currentChanged.connect((_, widget) => {
      // @ts-ignore
      const notebook = new NotebookAPI(widget);
      notebook.ready.then(() => {
        console.log('ITS ALIVE', notebook);
        
        renderUI(myUI, { notebook, dfMap: null });
        notebook.changed.connect(async () => {
          // let variables = await notebook.kernel.getEnv();
          let dfMap = await notebook.kernel.getDataFramesWithColumns();
          renderUI(myUI, { notebook, dfMap });
        });
      });
    });

  },
  requires: [INotebookTracker],
};

function buildUI(app: JupyterFrontEnd) {

  const widget = new Widget();
  widget.addClass('jp-example-view');
  widget.id = 'auto-profile-app';
  widget.title.caption = 'AutoProfile';
  widget.title.label = "AutoProfile"
  widget.title.iconClass = 'jp-SideBar-tabIcon myIcon';
  app.shell.add(widget, 'left', { rank: 600 });

  return widget

}

function renderUI(widget: Widget, props = {}) {
  console.log("Rendering panel view...")

  new App({
    target: widget.node,
    props
  });

}
export default plugin;
