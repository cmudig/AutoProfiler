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
  id: 'AutoProfile',
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
          // let variables = await notebook.kernel.getEnv();
          let dfMap = await notebook.kernel.getDataFramesWithColumns();
          renderUI(myUI, { notebook, dfMap });
        });
      });
    });
  },
  requires: [ILayoutRestorer, INotebookTracker]
};

function buildUI(app: JupyterFrontEnd, layout: ILayoutRestorer) {
  /* 

  TODO rewrite this to svelte and get rid of lumino, see https://github.com/mkery/Verdant/blob/master/verdant/index.ts
  
  */

  const myView = new Widget(); // can replace this stuff
  const sidePanel = new StackedPanel();
  sidePanel.id = 'myApp';
  sidePanel.title.iconClass = 'myIcon jp-SideBar-tabIcon';
  sidePanel.title.caption = 'AutoProfile';
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
