import type { ICellModel } from '@jupyterlab/cells';
import { Signal } from '@lumino/signaling';

export default class CellAPI {
  _runSignal = new Signal<this, void>(this);
  model: ICellModel;
  index: number;

  constructor(model: ICellModel, index: number) {
    this.model = model;
    this.index = index;
  }

  set text(text: string) {
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
