import { StackedPanel } from '@lumino/widgets';
import type { ISessionContext } from '@jupyterlab/apputils';
import type { Message } from '@lumino/messaging';
import type { NotebookAPI } from './dataAPI/jupyter/notebook';
import { ProfileModel } from './dataAPI/ProfileModel';
import { ProfileView } from './components/ProfileView';
import { LabIcon } from '@jupyterlab/ui-components';
import appIconStr from '../style/logo.svg';
import { Logger } from './logger/Logger';

export class ProfilePanel extends StackedPanel {
    constructor() {
        super();
        this.addClass('auto-profile-wrapper');
        this.id = 'auto-profile-app';
        this.title.caption = 'Autoprofiler'; // shown on hover
        this.title.iconClass = 'autoprofile-logo';

        const icon = new LabIcon({
            name: 'auto-profile-app:app-icon',
            svgstr: appIconStr
        });

        this.title.icon = icon;

        // MODEL init
        this._profileModel = new ProfileModel(this._sessionContext);
        this._logger = new Logger(this._profileModel);
        this._profileModel.addLogger(this._logger);

        // VIEW init
        this._profileView = new ProfileView(this._profileModel);
        this.addWidget(this._profileView);
    }

    // ~~~~~~~~~ Variables, getters, setters ~~~~~~~~~
    private _sessionContext: ISessionContext;
    private _profileModel: ProfileModel;
    private _profileView: ProfileView;
    private _logger: Logger;

    get session(): ISessionContext {
        return this._sessionContext;
    }

    set session(session: ISessionContext) {
        this._sessionContext = session;
    }

    public async connectNotebook(notebook: NotebookAPI) {
        this.session = notebook.panel.sessionContext;
        await this._profileModel.connectNotebook(notebook, () => { return this.isVisible });
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

    /**
     * Called before the widget is made visible.
     * other useful state messages are onAfterShow, 
     * onBeforeHide, onAfterHide.
     * @param msg 
     */
    protected onBeforeShow(msg: Message): void {
        this._profileModel.updateAll();
    }

}