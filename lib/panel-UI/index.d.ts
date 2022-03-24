import * as React from 'react';
import { NotebookAPI } from '../jupyter-hooks/notebook';
declare type MyAppUI_Props = {
    notebook?: NotebookAPI;
    variables?: {
        names: string[];
        types: string[];
    };
};
export default class MyAppUI extends React.Component<MyAppUI_Props> {
    render(): JSX.Element;
    showNotebook(): JSX.Element;
    showSelectedCell(): JSX.Element;
    showButtons(): JSX.Element;
    showVariables(): JSX.Element;
}
export {};
