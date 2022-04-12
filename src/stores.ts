import { writable } from "svelte/store";
import type { Writable } from 'svelte/store';
// import type { NotebookAPI } from './jupyterAPI/notebook'
// import type { IData } from './jupyterAPI/kernel'

import type {Executor} from "./dataAPI/DataWrapper"

export const dataAccessor: Writable<Executor> = writable(undefined);


// export const notebookStore: Writable<NotebookAPI> = writable(undefined);
// export const dataframesWithColumnsStore: Writable<IData> = writable(undefined);

// async function loadData(fileName: string): Promise<ArqueroExecutor> {
//     const data = await aq.loadCSV(fileName, { delimiter: ',' });

//     let dataHandler = new ArqueroExecutor(data)

//     let rp = new Promise<ArqueroExecutor>(resolve => {
//         resolve(dataHandler)
//     })
//     return rp
// }

// let dataHandler = loadData(fileName)

// export const dataHandlerStore: Writable<Executor> = writable(dataHandler);
