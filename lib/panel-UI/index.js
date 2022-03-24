"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
class MyAppUI extends React.Component {
    render() {
        return (React.createElement("div", null,
            React.createElement("div", { id: "header-icon" }),
            this.showNotebook(),
            this.showSelectedCell(),
            this.showButtons(),
            this.showVariables()));
    }
    showNotebook() {
        if (this.props.notebook) {
            let lang = this.props.notebook.language || '?';
            return (React.createElement("div", null,
                React.createElement("h4", null, this.props.notebook.name),
                React.createElement("p", null,
                    "is a ",
                    React.createElement("b", null, lang),
                    " notebook")));
        }
        return null;
    }
    showSelectedCell() {
        if (this.props.notebook) {
            console.log("This.props.notebook is ", this.props.notebook);
            let cell = this.props.notebook.activeCell;
            return (React.createElement("div", null,
                React.createElement("h5", null, `you hath selected a ${cell.type} cell:`),
                React.createElement("p", { className: "code" }, `${cell.text}`)));
        }
        return null;
    }
    showButtons() {
        if (this.props.notebook) {
            let index = this.props.notebook.activeCell.index;
            let code = '"hey there I\'m a code cell"';
            let markdown = "_hey I'm a markdown cell_";
            let text = this.props.notebook.activeCell.text;
            return (React.createElement("div", null,
                React.createElement("div", { className: "demo-button", onClick: () => {
                        this.props.notebook.addCell('code', code, index);
                    } }, "add code cell above"),
                React.createElement("div", { className: "demo-button", onClick: () => {
                        this.props.notebook.addCell('markdown', markdown, index + 1);
                    } }, "add markdown cell below"),
                React.createElement("div", { className: "demo-button", onClick: () => {
                        text = text + '#!!! :O ';
                        this.props.notebook.activeCell.text = text;
                    } }, "edit selected cell")));
        }
    }
    showVariables() {
        if (this.props.variables) {
            return (React.createElement("div", null,
                React.createElement("h5", null, "(variable / type) in user's environment:"),
                this.props.variables['names'].map((name, index) => {
                    return (React.createElement("p", { key: index, className: "demo-envVar" }, `(${name} / ${this.props.variables['types'][index]})`));
                })));
        }
        return null;
    }
}
exports.default = MyAppUI;
//# sourceMappingURL=index.js.map