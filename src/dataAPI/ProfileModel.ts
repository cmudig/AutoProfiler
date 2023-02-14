
import type { ISessionContext } from '@jupyterlab/apputils';
import { type Writable, writable, get } from 'svelte/store';
import type { NotebookAPI } from './jupyter/notebook';
import { PythonPandasExecutor } from './jupyter/PythonExecutor'
import type {
    IDFColMap,
    IDFProfileWStateMap,
    ColumnProfileData,
    IDFProfileWState
} from '../common/exchangeInterfaces';
import {
    NUMERICS,
    TIMESTAMPS,
    CATEGORICALS
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
        if (this.notebook.mostRecentExecutionCount) {
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

    public async connectNotebook(notebook: NotebookAPI) {
        console.log('Connecting notebook to ProfilePanel');
        this._notebook = notebook;
        this.executor.setSession(notebook.panel.sessionContext);
        this.resetData();

        await this.executor.session.ready;

        this._name.set(this.executor.session.name)
        this.logger.log('ProfileModel.connectNotebook', { notebookName: this.executor.session.name })
        // have to do this as arrow function or else this doesnt work
        this._notebook.changed.connect((sender, value) => {
            // when cell is run, update data
            if (value === 'cell run') {
                this.updateRootData();
            }

            if (value == "name") {
                this.name.set(this._notebook.name)
            }

            if (value == "activeCell") {
                this.handleCellSelect()
            }
        });
        this.listenForRestart();
        this._ready.set(true);
        this.updateRootData();
    }

    public async listenForRestart() {
        this.executor.session.session?.kernel.statusChanged.connect((_, status) => {
            if (status.endsWith('restarting')) {
                this.resetData();
                this.logger.log('ProfileModel.kernelRestarted', { notebookName: this.name })
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

    public async updateRootData() {
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

                    if (!_.isUndefined(currentProfiles)) {
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
                                    this.logger.log('ProfileModel.updateData', { dfName })
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

    private async handleCellSelect() {
        const cellCode = this._notebook.activeCell.text
        const variablesInCell = await this._executor.getVariableNamesInPythonStr(cellCode)

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
        const resultData: ColumnProfileData[] = [];

        for (let j = 0; j < colMetaInfoArr.length; j++) {
            const ci = colMetaInfoArr[j];
            const col_name = ci.col_name;
            const col_type = ci.col_type;
            const isIndex = ci.col_is_index;

            // model calls
            const rowVC = await this.executor.getValueCounts(dfName, col_name, isIndex);
            const colMd = await this.executor.getColMeta(dfName, col_name, isIndex);

            const cd: ColumnProfileData = {
                name: col_name,
                type: col_type,
                isIndex,
                summary: {
                    cardinality: colMd.numUnique,
                    topK: rowVC
                },
                nullCount: colMd.nullCount,
                example: rowVC[0]?.value
            };

            // need at least 1 non-null row to calculate these
            if (shape[0] > 0 && shape[0] > colMd.nullCount) {
                if (NUMERICS.has(col_type)) {
                    const chartData = await this.executor.getQuantBinnedData(dfName, col_name, isIndex);
                    const statistics = await this.executor.getQuantMeta(dfName, col_name, isIndex);

                    // replace min on far bin with true minimum since pandas puts the left bin edge lower
                    if (!_.isUndefined(chartData[0])) {
                        chartData[0].low = statistics.min
                    }

                    cd.summary.quantMeta = statistics;
                    cd.summary.histogram = chartData;
                } else if (TIMESTAMPS.has(col_type)) {
                    const histogram = await this.executor.getTempBinnedData(dfName, col_name, isIndex);
                    const interval = await this.executor.getTempInterval(dfName, col_name, isIndex);
                    const temporalFact = await this.executor.getTemporalMeta(dfName, col_name, isIndex);
                    cd.summary.histogram = histogram;
                    cd.summary.timeInterval = interval;
                    cd.summary.temporalMeta = temporalFact
                } else if (CATEGORICALS.has(col_type)) {
                    const stringSummary = await this.executor.getStringMeta(dfName, col_name, isIndex);
                    cd.summary.stringMeta = stringSummary;
                }
            }
            resultData.push(cd);
        }

        return { profile: resultData, shape, dfName, lastUpdatedTime: Date.now(), isPinned: false, warnings: [] };
    }

}
