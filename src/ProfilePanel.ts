import { StackedPanel } from '@lumino/widgets';
import type { ISessionContext} from '@jupyterlab/apputils';
// import type { ServiceManager } from '@jupyterlab/services';
import type { Message } from '@lumino/messaging';
import type { NotebookAPI } from './dataAPI/jupyter/notebook'
import { ProfileModel } from './ProfileModel';
import { ProfileView } from './ProfileView';


export class ProfilePanel extends StackedPanel {
    constructor() {
        super();
        // this._translator = translator || nullTranslator;
        // this._trans = this._translator.load('jupyterlab');
        this.addClass('AutoProfileWrapper');
        this.id = 'auto-profile-app';
        this.title.caption = 'AutoProfile';
        this.title.label = "AutoProfile"
        this.title.iconClass = 'jp-SideBar-tabIcon myIcon';

        // this._sessionContext = // pass in notebook session context
        // this._sessionContext = new SessionContext({
        //     sessionManager: manager.sessions,
        //     specsManager: manager.kernelspecs,
        //     name: 'Extension Examples',
        // });

        // MODEL init
        this._profileModel = new ProfileModel(this._sessionContext);

        // VIEW init
        this._profileView = new ProfileView(this._profileModel);
        this.addWidget(this._profileView);

        // void this._sessionContext
        //     .initialize()
        //     .then(async (value) => {
        //         if (value) {
        //             await sessionContextDialogs.selectKernel(this._sessionContext);
        //         }
        //     })
        //     .catch((reason) => {
        //         console.error(
        //             `Failed to initialize the session in ExamplePanel.\n${reason}`
        //         );
        //     });
    }

    // ~~~~~~~~~ Variables, getters, setters ~~~~~~~~~
    private _sessionContext: ISessionContext;
    private _profileModel: ProfileModel;
    private _profileView: ProfileView;

    // private _notebookUpdated = new Signal<this, 

    get session(): ISessionContext {
        return this._sessionContext;
    }

    set session(session: ISessionContext) {
        this._sessionContext = session;
    }

    public async connectNotebook(notebook: NotebookAPI) {
        this.session = notebook.panel.sessionContext
        await this._profileModel.connectNotebook(notebook);
    }

    // ~~~~~~~~~ Lifecycle methods for closing panel ~~~~~~~~~
    dispose(): void {
        this._sessionContext.dispose();
        super.dispose();
    }

    protected onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
        this.dispose();
    }
}
