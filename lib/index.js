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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const application_1 = require("@jupyterlab/application");
const notebook_1 = require("@jupyterlab/notebook");
const widgets_1 = require("@lumino/widgets");
const React = __importStar(require("react"));
const ReactDOM = __importStar(require("react-dom"));
require("../style/index.css");
const index_1 = __importDefault(require("./panel-UI/index"));
const notebook_2 = require("./jupyter-hooks/notebook");
/**
 * Initialization data for the codegen extension.
 */
const extension = {
    id: 'codegen',
    autoStart: true,
    activate: (app, layout, notebookTracker) => {
        /*
         * This makes us a side panel UI to display our
         * extension's view. Note this is purely optional: your extension
         * doesn't actually need any panel view to run.
         */
        const myUI = buildUI(app, layout);
        notebookTracker.currentChanged.connect((_, widget) => {
            const notebook = new notebook_2.NotebookAPI(widget);
            notebook.ready.then(() => {
                console.log('ITS ALIVE', notebook);
                renderUI(myUI, { notebook, variables: null });
                notebook.changed.connect(() => __awaiter(void 0, void 0, void 0, function* () {
                    let variables = yield notebook.kernel.getEnv();
                    renderUI(myUI, { notebook, variables });
                }));
            });
        });
    },
    requires: [application_1.ILayoutRestorer, notebook_1.INotebookTracker]
};
function buildUI(app, layout) {
    const myView = new widgets_1.Widget();
    const sidePanel = new widgets_1.StackedPanel();
    sidePanel.id = 'myApp';
    sidePanel.title.iconClass = 'myIcon jp-SideBar-tabIcon';
    sidePanel.title.caption = 'CodeGen Demo App';
    sidePanel.addWidget(myView);
    // add side panel view to JupyterLab
    layout.add(sidePanel, 'v-VerdantPanel');
    app.shell.add(sidePanel, 'left');
    renderUI(myView);
    return myView;
}
function renderUI(widget, props = {}) {
    console.log("Rendering panel view...");
    // now render the panel view
    let ui = React.createElement(index_1.default, props);
    ReactDOM.render(ui, widget.node);
}
exports.default = extension;
//# sourceMappingURL=index.js.map