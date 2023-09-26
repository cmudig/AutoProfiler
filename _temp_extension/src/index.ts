import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the digautoprofiler extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'digautoprofiler:plugin',
  description: 'Automatically profile your pandas dataframes in jupyter lab.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension digautoprofiler is activated!');
  }
};

export default plugin;
