
import type { ISessionContext } from '@jupyterlab/apputils';
import { type Writable, writable, get } from 'svelte/store';
import type { NotebookAPI } from './jupyter/notebook';
import { PythonPandasExecutor } from './jupyter/PythonExecutor'
import type {
    IDFColMap,
    IDFProfileWStateMap,
    ColumnProfileData,
    IDFProfileWState,
    IColTypeTuple
} from '../common/exchangeInterfaces';
import {
    NUMERICS,
    TIMESTAMPS,
    CATEGORICALS,
    BOOLEANS
} from '../components/data-types/pandas-data-types';
import _ from 'lodash';
import type { Logger } from '../logger/Logger';

export class ProfileModel {

    private _notebook: NotebookAPI;
    private _ready: Writable<boolean> = writable(false);
    private _columnProfiles: Writable<IDFProfileWStateMap> = writable(undefined)
    private _loadingNewData: Writable<boolean> = writable(false);
    private _executor: PythonPandasExecutor
    private _name: Writable<string> = writable(undefined)
    private _varsInCurrentCell: Writable<string[]> = writable([])
    private _logger;

    constructor(session: ISessionContext) {
        this._executor = new PythonPandasExecutor(session)
    }

    get ready(): Writable<boolean> {
        return this._ready;
    }

    get loading(): Writable<boolean> {
        return this._loadingNewData;
    }

    get executor(): PythonPandasExecutor {
        return this._executor
    }

    get language(): Promise<string> | undefined {
        return this.executor.session?.session?.kernel?.info?.then(infoReply => {
            return infoReply.language_info.name;
        });
    }

    get name(): Writable<string> {
        return this._name
    }

    get columnProfiles(): Writable<IDFProfileWStateMap | undefined> {
        return this._columnProfiles
    }

    get variablesInCurrentCell(): Writable<string[]> {
        return this._varsInCurrentCell
    }

    get notebook(): NotebookAPI {
        return this._notebook
    }

    get currentOutputName(): string {
        if (this.notebook?.mostRecentExecutionCount) {
            return `_${this.notebook.mostRecentExecutionCount}`
        }
        return undefined
    }

    get logger(): Logger {
        return this._logger
    }

    addLogger(logger: Logger) {
        this._logger = logger
    }

    /**
     * connectNotebook: connect to a notebook, assumes the notebook connection is ready but might not have valid connection
     * @param notebook notebook connection 
     * @param widgetIsVisible function that says if AP is visible to user
     */
    public async connectNotebook(notebook: NotebookAPI, widgetIsVisible: () => boolean) {
        this._notebook = notebook;
        this.resetData();
        this.executor.setSession(notebook.panel?.sessionContext);

        if (this.notebook.hasConnection) {

            await this.executor.session.ready;

            this._name.set(this.executor.session.name)
            // this.logger.log('AutoProfiler.connectNotebook', { notebookName: this.executor.session.name })
            // have to do this as arrow function or else this doesnt work
            this._notebook.changed.connect((sender, value) => {
                // when cell is run, update data
                if (value === 'cell run') {
                    if (widgetIsVisible()) {
                        this.updateRootData();
                    }
                }

                if (value == "name") {
                    this.name.set(this._notebook.name)
                }

                if (value == "activeCell") {
                    if (widgetIsVisible()) {
                        this.handleCellSelect()
                    }
                }
            });
            this.listenForRestart();
            this.ready.set(true);
            this.updateRootData();

        } else {
            this.ready.set(false);
            this.name.set(undefined)
        }

    }

    public async listenForRestart() {
        this.executor.session.session?.kernel.statusChanged.connect((_, status) => {
            if (status.endsWith('restarting')) {
                this.resetData();
                // this.logger.log('ProfileModel.kernelRestarted', { notebookName: this.name })
            }
        });
    }

    public resetData() {
        this._columnProfiles.set(undefined);
    }

    public addCell(kind: 'code' | 'markdown', text: string) {
        if (this.notebook) {
            this.notebook.addCell(kind, text);
        }
    }

    /** 
     * Called when widget is shown, updating root data may not always be necessary
    **/
    public updateAll() {
        this.updateRootData()
        this.handleCellSelect()
    }

    public async updateRootData() {
        if (this.notebook) {
            this._loadingNewData.set(true)
            let alldf = await this.executor.getAllDataFrames(this.currentOutputName);


            // only update if we have detected dataframes
            if (!_.isEmpty(alldf)) {

                // more cells might have executed, so filter to only dataframes in current cell
                const currentDfs = Object.keys(alldf).filter((key: string) => {
                    if (key == this.currentOutputName) {
                        return true
                    } else if (key.charAt(0) == '_') {
                        return false
                    }
                    return true
                }).reduce((obj, key) => {
                    return {
                        ...obj,
                        [key]: alldf[key]
                    }
                }, {})

                const colPromise = this.fetchColumnPromises(currentDfs);

                colPromise.then(result => {

                    this._columnProfiles.update((currentProfiles: IDFProfileWStateMap) => {

                        if (!(currentProfiles == undefined)) {
                            for (const [dfName, currentDfProfile] of Object.entries(currentProfiles)) {
                                const { lastUpdatedTime, isPinned, ...currentShapeAndProfile } = currentDfProfile

                                // check if in result, otherwise was deleted
                                if (dfName in result) {
                                    const { lastUpdatedTime: tTime, isPinned: tPinned, ...newShapeAndProfile } = result[dfName]

                                    // copy over state
                                    result[dfName].lastUpdatedTime = lastUpdatedTime
                                    result[dfName].isPinned = isPinned

                                    if (!_.isEqual(currentShapeAndProfile, newShapeAndProfile)) {
                                        result[dfName].lastUpdatedTime = Date.now()
                                        this.logger.log('AutoProfiler.updateData', { dfName })
                                    }
                                }
                            }
                        }

                        // copy warnings over from alldf to result
                        for (const [dfName, dfInfo] of Object.entries(alldf)) {
                            if (dfName in result) {
                                result[dfName].warnings = dfInfo.warnings
                            }
                        }

                        return result
                    });
                    this._loadingNewData.set(false);
                });
            } else {
                this._loadingNewData.set(false);
            }
        }
    }

    private async handleCellSelect() {
        const cellCode = this._notebook?.activeCell?.text
        let variablesInCell: string[] = []
        if (!(cellCode == undefined)) {
            variablesInCell = await this._executor.getVariableNamesInPythonStr(cellCode)
        }

        // determine which ones are actual dataframes
        const profiles = get(this.columnProfiles)
        if (profiles) {
            const dfNames = Object.keys(profiles)
            const dfNamesInSelection = variablesInCell.filter(value => dfNames.includes(value));
            this.variablesInCurrentCell.set(dfNamesInSelection)
        }

    }

    // ################################# State updates ############################################
    private async fetchColumnPromises(
        dfColMap: IDFColMap): Promise<IDFProfileWStateMap> {
        const colProfileMap: IDFProfileWStateMap = {};
        const alldf_names = Object.keys(dfColMap);

        const resolved_profiles = await Promise.all(
            alldf_names.map((dfName: string) => {
                return this.getColProfiles(dfName, dfColMap);
            })
        );

        alldf_names.forEach((dfName, index) => {
            colProfileMap[dfName] = resolved_profiles[index];
            colProfileMap[dfName].warnings = dfColMap[dfName].warnings
        });
        return colProfileMap;
    }

    private async getColProfiles(
        dfName: string,
        dfColMap: IDFColMap
    ): Promise<IDFProfileWState> {
        const shape = await this.executor.getShape(dfName);
        const colMetaInfoArr = dfColMap[dfName].columns;
        let resultData: ColumnProfileData[] = [];

        // Handle empty dataframe
        if (shape[0] === 0) {
            resultData = colMetaInfoArr.map((x: IColTypeTuple) => ({
                colName: x.colName,
                colType: x.colType,
                colIsIndex: x.colIsIndex,
                nullCount: 0,
                summary: { // default numeric summary
                    histogram: undefined,
                    quantMeta: undefined,
                    summaryType: undefined
                },
            }))
        } else {
            for (let j = 0; j < colMetaInfoArr.length; j++) {
                const colInfo = colMetaInfoArr[j];

                let cd: ColumnProfileData;

                // TODO still need to handle all null columns and booleans

                if (NUMERICS.has(colInfo.colType)) {
                    cd = await this.executor.getNumericData(dfName, colInfo)
                } else if (TIMESTAMPS.has(colInfo.colType)) {
                    cd = await this.executor.getTemporalData(dfName, colInfo)
                } else if (CATEGORICALS.has(colInfo.colType)) {
                    cd = await this.executor.getCategoricalData(dfName, colInfo)
                } else if (BOOLEANS.has(colInfo.colType)) {
                    cd = await this.executor.getBooleanData(dfName, colInfo)
                }
                resultData.push(cd);
            }
        }

        return { profile: resultData, shape, dfName, lastUpdatedTime: Date.now(), isPinned: false, warnings: [] };
    }

}
