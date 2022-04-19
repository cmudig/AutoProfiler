import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookAPI } from './dataAPI/jupyter/notebook'
import { ProfilePanel } from './ProfilePanel';

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

    let panel: ProfilePanel = new ProfilePanel();
    app.shell.add(panel, 'left'); //{ rank: 600 }

    // emitted when the user's notebook changes I think...
    notebookTracker.currentChanged.connect((_, widget) => {
      console.log("Notebook current changed signal called.")

      const notebook = new NotebookAPI(widget);
      notebook.ready.then(async () => {
        console.log('Notebook ready! ---', notebook);

        // connect panel to notebook
        await panel.connectNotebook(notebook);
      });
    });

  },
  requires: [INotebookTracker],
};

export default plugin;
