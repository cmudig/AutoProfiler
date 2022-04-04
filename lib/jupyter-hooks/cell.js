"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signaling_1 = require("@lumino/signaling");
class CellAPI {
    _runSignal = new signaling_1.Signal(this);
    model;
    index;
    constructor(model, index) {
        this.model = model;
        this.index = index;
    }
    set text(text) {
        this.model.value.text = text;
    }
    get text() {
        return this.model.value.text;
    }
    get type() {
        return this.model.type;
    }
    // an event emitted when the code/markdown changes
    edited() {
        return this.model.value.changed;
    }
    // an event emitted when this cell is run
    run() {
        return this._runSignal;
    }
}
exports.default = CellAPI;
//# sourceMappingURL=cell.js.map