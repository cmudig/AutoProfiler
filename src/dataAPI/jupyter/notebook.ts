import { NotebookPanel, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { PathExt } from '@jupyterlab/coreutils';
import { Signal, type ISignal } from '@lumino/signaling';
import _ from 'lodash';

import CellAPI from './cell';
// import KernelAPI from './kernel'

export class NotebookAPI {
    private readonly _ready: PromiseDelegate<void>;
    private _changed = new Signal<this, string>(this);
    private _hasConnection = false;

    panel: NotebookPanel | undefined;
    // kernel: KernelAPI;
    cells: CellAPI[];
    mostRecentExecutionCount: number;

    constructor(notebookPanel: NotebookPanel) {
        this.panel = notebookPanel;
        this._ready = new PromiseDelegate<void>();

        if (!(this.panel == undefined)) {
            this.listenToSession();
            this.panel.revealed.then(() => {
                this.listenToCells();
                this._hasConnection = true
                this._ready.resolve();
            });
        } else {
            this._ready.resolve();
        }
    }

    saveToNotebookMetadata(key: string, value: any) {
        this.panel.model.metadata.set(key, value);
    }

    // ready is a Promise that resolves once the notebook is done loading
    get ready(): Promise<void> {
        return this._ready.promise;
    }

    get hasConnection(): boolean {
        return this._hasConnection;
    }

    // changed is a signal emitted when various things in this notebook change
    get changed(): ISignal<NotebookAPI, string> {
        return this._changed;
    }

    get notebook(): Notebook | undefined {
        return this.panel?.content;
    }

    get language(): string | undefined {
        const meta = this.notebook?.model?.metadata;
        if (meta?.has('language_info')) {
            const val = meta?.get('language_info')?.valueOf();
            if (val instanceof Object) {
                return val['name'];
            }
        }
    }

    get path(): string | undefined {
        return this.panel?.sessionContext?.path;
    }

    get name(): string | undefined {
        return this.path ? PathExt.basename(this.path) : undefined;
    }

    get activeCell(): CellAPI | undefined {
        if (this.notebook && this.cells) {
            const active = this.notebook.activeCell;
            return this.cells.find(c => c.model.id === active.model.id);
        }
        return undefined;
    }

    public addCell(kind: 'code' | 'markdown', text: string, index?: number) {
        let cell;
        if (kind === 'code') {
            cell = this.notebook.model.contentFactory.createCodeCell({});
        } else {
            cell = this.notebook.model.contentFactory.createMarkdownCell({});
        }
        cell.value.text = text;

        // if no index provided, insert at current position
        if (index == undefined) {
            const active = this.notebook.activeCell;
            index = this.cells.findIndex(c => c.model.id === active.model.id);
            index += 1
        }

        this.notebook.model.cells.insert(index, cell);
    }

    // Various notebook level events you can listen to
    private listenToCells() {
        this.loadCells();

        // event fires when cells are added, deleted, or moved
        this.notebook.model.cells.changed.connect(() => {
            this.loadCells();
            this._changed.emit('cells');
        });

        // event fires when the user selects a cell
        this.notebook.activeCellChanged.connect((_, cell) => {
            this._changed.emit('activeCell');
        });

        // event fires when any cell is run
        NotebookActions.executed.connect((_, args) => {
            // can get execution signals from other notebooks
            if (args.notebook.id === this.notebook.id) {
                const cell = this.cells.find(
                    c => c.model.id === args.cell.model.id
                );
                if (cell) {
                    const exCount = cell.getExecutionCount()
                    if (exCount) {
                        this.mostRecentExecutionCount = exCount
                    }
                    cell._runSignal.emit();
                    this._changed.emit('cell run');
                }
            }
        });

        this.notebook.model.metadata.changed.connect((_, args) => {
            this._changed.emit('language changed');
        })

    }

    private listenToSession() {
        // event fires when the user moves or renames their notebook
        this.panel.sessionContext.propertyChanged.connect((_, prop) => {
            if (prop === 'path') {
                this._changed.emit('path');
            }
            if (prop === 'name') {
                this._changed.emit('name');
            }
        });
    }

    private loadCells() {
        this.cells = [];
        for (let i = 0; i < this.notebook.model.cells.length; i++) {
            this.cells.push(new CellAPI(this.notebook.model.cells.get(i), i));
        }
    }
}
