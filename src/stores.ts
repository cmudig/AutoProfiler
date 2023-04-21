import { type Writable, writable } from 'svelte/store';

// UI stores
export const currentHoveredCol: Writable<string> = writable(undefined);
export const showIndex: Writable<boolean> = writable(false);
