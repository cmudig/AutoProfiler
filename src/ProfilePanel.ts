import { StackedPanel } from '@lumino/widgets';
import type { ISessionContext } from '@jupyterlab/apputils';
import type { Message } from '@lumino/messaging';
import type { NotebookAPI } from './dataAPI/jupyter/notebook';
import { ProfileModel } from './dataAPI/ProfileModel';
import { ProfileView } from './components/ProfileView';

export class ProfilePanel extends StackedPanel {
    constructor() {
        super();
        this.addClass('auto-profile-wrapper');
        this.id = 'auto-profile-app';
        this.title.caption = 'AutoProfile';
        this.title.label = 'AutoProfile';
        this.title.iconClass = 'jp-SideBar-tabIcon autoprofile-logo';

        // MODEL init
        this._profileModel = new ProfileModel(this._sessionContext);

        // VIEW init
        this._profileView = new ProfileView(this._profileModel);
        this.addWidget(this._profileView);
    }

    // ~~~~~~~~~ Variables, getters, setters ~~~~~~~~~
    private _sessionContext: ISessionContext;
    private _profileModel: ProfileModel;
    private _profileView: ProfileView;

    get session(): ISessionContext {
        return this._sessionContext;
    }

    set session(session: ISessionContext) {
        this._sessionContext = session;
    }

    public async connectNotebook(notebook: NotebookAPI) {
        this.session = notebook.panel.sessionContext;
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
