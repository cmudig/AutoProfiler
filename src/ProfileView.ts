
import { Widget } from '@lumino/widgets';
import type { ProfileModel } from './ProfileModel';
import Profiler from './components/Profiler.svelte';

export class ProfileView extends Widget {
    constructor(model: ProfileModel) {
        super()
        this.addClass('AutoProfileApp');
        this._model = model;

        new Profiler({
            target: this.node,
            props: {
                profileModel: this._model
            }
        });
    }

    private _model: ProfileModel;
}
