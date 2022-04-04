"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotebookAPI = void 0;
const notebook_1 = require("@jupyterlab/notebook");
const coreutils_1 = require("@lumino/coreutils");
const coreutils_2 = require("@jupyterlab/coreutils");
const signaling_1 = require("@lumino/signaling");
const cell_1 = __importDefault(require("./cell"));
const kernel_1 = __importDefault(require("./kernel"));
class NotebookAPI {
    _ready;
    _changed = new signaling_1.Signal(this);
    panel;
    kernel;
    cells;
    constructor(notebookPanel) {
        this.panel = notebookPanel;
        this.kernel = new kernel_1.default(this.panel.sessionContext);
        this.listenToSession();
        this._ready = new coreutils_1.PromiseDelegate();
        this.panel.revealed.then(() => {
            this.listenToCells();
            this._ready.resolve();
        });
    }
    /*
    * Here are some events that you can signal to other parts of your app
    */
    // ready is a Promise that resolves once the notebook is done loading
    get ready() {
        return this._ready.promise;
    }
    // changed is a signal emitted when various things in this notebook change
    get changed() {
        return this._changed;
    }
    /*
    * Here are a bunch of utility functions to get useful information about
    * the user's current notebook
    */
    get notebook() {
        return this.panel.content;
    }
    get language() {
        let meta = this.notebook.model?.metadata;
        if (meta.has("language_info")) {
            let val = this.notebook.model.metadata.get("language_info").valueOf();
            if (val instanceof Object)
                return val['name'];
        }
    }
    get path() {
        return this.panel.sessionContext.path;
    }
    get name() {
        return coreutils_2.PathExt.basename(this.path);
    }
    get activeCell() {
        const active = this.notebook.activeCell;
        return this.cells.find(c => c.model.id === active.model.id);
    }
    addCell(kind, text, index) {
        let cell;
        if (kind === 'code')
            cell = this.notebook.model.contentFactory.createCodeCell({});
        else
            cell = this.notebook.model.contentFactory.createMarkdownCell({});
        cell.value.text = text;
        this.notebook.model.cells.insert(index, cell);
    }
    /*
    * Various notebook level events you can listen to
    */
    listenToCells() {
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
        notebook_1.NotebookActions.executed.connect((_, args) => {
            // can get execution signals from other notebooks
            if (args.notebook.id === this.notebook.id) {
                const cell = this.cells.find(c => c.model.id === args.cell.model.id);
                if (cell) {
                    cell._runSignal.emit();
                    this._changed.emit('cell run');
                }
            }
        });
    }
    listenToSession() {
        // event fires when the user moves or renames their notebook
        this.panel.sessionContext.propertyChanged.connect((_, prop) => {
            if (prop === 'path')
                this._changed.emit('path');
            if (prop === 'name')
                this._changed.emit('name');
        });
    }
    loadCells() {
        this.cells = [];
        for (let i = 0; i < this.notebook.model.cells.length; i++) {
            this.cells.push(new cell_1.default(this.notebook.model.cells.get(i), i));
        }
    }
}
exports.NotebookAPI = NotebookAPI;
//# sourceMappingURL=notebook.js.map