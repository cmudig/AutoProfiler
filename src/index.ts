import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

import { StackedPanel, Widget } from '@lumino/widgets';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import '../style/index.css';
import MyAppUI from './panel-UI/index';
import { NotebookAPI } from './jupyter-hooks/notebook';

/**
 * Initialization data for the codegen extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'codegen',
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    layout: ILayoutRestorer,
    notebookTracker: INotebookTracker
  ) => {
    /*
     * This makes us a side panel UI to display our
     * extension's view. Note this is purely optional: your extension
     * doesn't actually need any panel view to run.
     */
    const myUI = buildUI(app, layout);

    notebookTracker.currentChanged.connect((_, widget) => {
      const notebook = new NotebookAPI(widget);
      notebook.ready.then(() => {
        console.log('ITS ALIVE', notebook);
        renderUI(myUI, { notebook, variables: null });
        notebook.changed.connect(async () => {
          let variables = await notebook.kernel.getEnv();
          renderUI(myUI, { notebook, variables });
        });
      });
    });
  },
  requires: [ILayoutRestorer, INotebookTracker]
};

function buildUI(app: JupyterFrontEnd, layout: ILayoutRestorer) {
  const myView = new Widget();
  const sidePanel = new StackedPanel();
  sidePanel.id = 'myApp';
  sidePanel.title.iconClass = 'myIcon jp-SideBar-tabIcon';
  sidePanel.title.caption = 'CodeGen Demo App';
  sidePanel.addWidget(myView);

  // add side panel view to JupyterLab
  layout.add(sidePanel, 'v-VerdantPanel');
  app.shell.add(sidePanel, 'left');

  renderUI(myView);
  return myView;
}

function renderUI(widget: Widget, props = {}) {
  console.log("Rendering panel view...")
  // now render the panel view
  let ui = React.createElement(MyAppUI, props);
  ReactDOM.render(ui, widget.node);
}

export default extension;
