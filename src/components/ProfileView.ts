import { Widget } from '@lumino/widgets';
import type { ProfileModel } from '../dataAPI/ProfileModel';
import Profiler from './Profiler.svelte';

export class ProfileView extends Widget {
    constructor(model: ProfileModel) {
        super();
        this.addClass('auto-profile-app');

        new Profiler({
            target: this.node,
            props: {
                profileModel: model
            }
        });
    }
}
