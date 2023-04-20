import type {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookAPI } from './dataAPI/jupyter/notebook';
import { ProfilePanel } from './ProfilePanel';

/**
 * Initialization data for the AutoProfiler extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
    id: 'AutoProfiler:plugin',
    autoStart: true,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
        const panel: ProfilePanel = new ProfilePanel();
        app.shell.add(panel, 'right', { rank: 1000 });

        // emitted when the user's notebook changes, null if all notebooks close
        notebookTracker.currentChanged.connect((_, widget) => {
            const notebook = new NotebookAPI(widget);
            notebook.ready.then(async () => {
                // connect panel to notebook
                await panel.connectNotebook(notebook);
            });
        });
    },
    requires: [INotebookTracker]
};

export default plugin;
