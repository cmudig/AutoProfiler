import { writable } from "svelte/store";
import type { Writable } from 'svelte/store';
import type {IDFColMap} from './dataAPI/exchangeInterfaces';

export const dataFramesAndCols: Writable<IDFColMap> = writable(undefined);
