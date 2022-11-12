import { type Writable, writable } from 'svelte/store';

// UI stores
export const currentHoveredCol: Writable<string> = writable(undefined);
