import type { ICellModel } from '@jupyterlab/cells';
import { Signal } from '@lumino/signaling';
export default class CellAPI {
    _runSignal: Signal<this, void>;
    model: ICellModel;
    index: number;
    constructor(model: ICellModel, index: number);
    set text(text: string);
    get text(): string;
    get type(): import("@jupyterlab/nbformat").CellType;
    edited(): import("@lumino/signaling").ISignal<import("@jupyterlab/observables").IObservableString, import("@jupyterlab/observables").IObservableString.IChangedArgs>;
    run(): Signal<this, void>;
}
