import { type Writable, writable } from 'svelte/store';


// UI stores
export const currentHoveredCol: Writable<string> = writable(undefined);

// ~~~~~~~~~~~ Backend data Stores ~~~~~~~~~~~~~~~~
// export const dataFramesAndCols: Writable<IDFColMap> = writable(undefined);
// export const profileModel: Writable<ProfileModel> = writable(undefined);
// export const isLoadingNewData: Writable<boolean> = writable(false);


