import { writable } from "svelte/store";
import type { Writable } from 'svelte/store';
import type {IDFColMap} from './common/exchangeInterfaces';

export const dataFramesAndCols: Writable<IDFColMap> = writable(undefined);

// TODO update this to a reactive store model so that when this updates I then fetch all the necessary data 
