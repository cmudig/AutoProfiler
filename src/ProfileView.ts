// import { UseSignal } from '@jupyterlab/apputils';

import type { ProfileModel } from './ProfileModel';

import { Widget } from '@lumino/widgets';
import Profiler from './components/Profiler.svelte';

export class ProfileView extends Widget {
    constructor(model: ProfileModel) {
        super()
        this.addClass('AutoProfileApp');
        this._model = model;

        // this._model.stateChanged signals data update

        new Profiler({
            target: this.node,
            props: {
                profileModel: this._model
            }
        });
    }

    private _model: ProfileModel;
    // private _svelteApp: any;
}
