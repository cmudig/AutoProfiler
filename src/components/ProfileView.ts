
import { Widget } from '@lumino/widgets';
import type { ProfileModel } from '../dataAPI/ProfileModel';
import Profiler from './Profiler.svelte';
import { profileModel } from '../stores';


export class ProfileView extends Widget {
    constructor(model: ProfileModel) {
        super()
        this.addClass('AutoProfileApp');
        profileModel.set(model);

        new Profiler({
            target: this.node,
        });
    }

}
