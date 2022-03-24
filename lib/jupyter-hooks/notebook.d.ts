import { NotebookPanel, Notebook } from '@jupyterlab/notebook';
import { ISignal } from '@lumino/signaling';
import CellAPI from './cell';
import KernelAPI from './kernel';
export declare class NotebookAPI {
    private readonly _ready;
    private _changed;
    panel: NotebookPanel;
    kernel: KernelAPI;
    cells: CellAPI[];
    constructor(notebookPanel: NotebookPanel);
    get ready(): Promise<void>;
    get changed(): ISignal<NotebookAPI, string>;
    get notebook(): Notebook;
    get language(): string;
    get path(): string;
    get name(): string;
    get activeCell(): CellAPI;
    addCell(kind: 'code' | 'markdown', text: string, index: number): void;
    private listenToCells;
    private listenToSession;
    private loadCells;
}
