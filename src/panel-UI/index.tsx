import * as React from 'react';
import { NotebookAPI } from '../jupyter-hooks/notebook';

type MyAppUI_Props = {
  notebook?: NotebookAPI;
  // variables?: { names: string[]; types: string[] };
  dfMap?: { [key: string]: string[] };
};

export default class MyAppUI extends React.Component<MyAppUI_Props> {
  render() {
    return (
      <div>
        <div id="header-icon" />
        {this.showNotebook()}
        {/* {this.showSelectedCell()} */}
        {/* {this.showButtons()} */}
        {this.showVariables()}
      </div>
    );
  }

  showNotebook() {
    if (this.props.notebook) {
      let lang = this.props.notebook.language || '?';
      return (
        <div id="notebookInfo">
          <h4>{this.props.notebook.name}</h4>
          <p>
            is a <b>{lang}</b> notebook
          </p>
        </div>
      );
    }
    return null;
  }

  showSelectedCell() {
    if (this.props.notebook) {
      console.log("This.props.notebook is ", this.props.notebook)
      let cell = this.props.notebook.activeCell;
      return (
        <div>
          <h5>{`you hath selected a ${cell.type} cell:`}</h5>
          <p className="code">{`${cell.text}`}</p>
        </div>
      );
    }
    return null;
  }

  showButtons() {
    if (this.props.notebook) {
      let index = this.props.notebook.activeCell.index;
      let code = '"hey there I\'m a code cell"';
      let markdown = "_hey I'm a markdown cell_";
      let text = this.props.notebook.activeCell.text;
      return (
        <div>
          <div
            className="demo-button"
            onClick={() => {
              this.props.notebook.addCell('code', code, index);
            }}
          >
            add code cell above
          </div>
          <div
            className="demo-button"
            onClick={() => {
              this.props.notebook.addCell('markdown', markdown, index + 1);
            }}
          >
            add markdown cell below
          </div>
          <div
            className="demo-button"
            onClick={() => {
              text = text + '#!!! :O ';
              this.props.notebook.activeCell.text = text;
            }}
          >
            edit selected cell
          </div>
        </div>
      );
    }
  }

  showVariables() {
    if (this.props.dfMap) {
      return (
        <div>
          <h5>Dataframes in user's environment:</h5>

          {Object.keys(this.props.dfMap).map((dfName) => {
            let columnInfo = this.props.dfMap[dfName];

            let columnElements = columnInfo.map(tuple => { return <li>{tuple[0]} <i>({tuple[1]})</i></li> })
            return (
              <div>
                <b>{dfName}</b>
                <ul> {columnElements} </ul>
              </div>
            )
          })
          }
        </div>
      );
    }
    return null;
  }
}
