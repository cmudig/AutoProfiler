import { writable } from "svelte/store";
import type {Writable} from 'svelte/store';
import type { NotebookAPI } from './jupyter-hooks/notebook';
import type {IData} from './jupyter-hooks/kernel';


export const notebookStore: Writable<NotebookAPI> = writable(undefined);
export const dfMapStore: Writable<IData> = writable(undefined);