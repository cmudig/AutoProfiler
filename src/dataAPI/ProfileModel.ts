import type { ISessionContext } from '@jupyterlab/apputils';
import { type Writable, writable, get } from 'svelte/store';
import type { NotebookAPI } from './jupyter/notebook';
import { PythonPandasExecutor } from './jupyter/PythonExecutor'
import type {
    IDFColMap,
    IColumnProfileMap,
    ColumnProfileData,
    IColumnProfileWrapper,
    TimeColumnSummary,
    TimeBin
} from '../common/exchangeInterfaces';
import {
    NUMERICS,
    TIMESTAMPS
} from '../components/data-types/pandas-data-types';
import _ from 'lodash';

export class ProfileModel {

    private _notebook: NotebookAPI;
    private _ready: Writable<boolean> = writable(false);
    private _columnProfiles: Writable<IColumnProfileMap> = writable(undefined)
    private _loadingNewData: Writable<boolean> = writable(false);
    private _executor: PythonPandasExecutor
    private _name: Writable<string> = writable(undefined)
    private _varsInCurrentCell: Writable<string[]> = writable([])

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

    get columnProfiles(): Writable<IColumnProfileMap> {
        return this._columnProfiles
    }

    get variablesInCurrentCell(): Writable<string[]> {
        return this._varsInCurrentCell
    }


    public async connectNotebook(notebook: NotebookAPI) {
        console.log('Connecting notebook to ProfilePanel');
        this._notebook = notebook;
        this.executor.setSession(notebook.panel.sessionContext);
        this.resetData();

        await this.executor.session.ready;

        this._name.set(this.executor.session.name)
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
            }
        });
    }

    public resetData() {
        this._columnProfiles.set(undefined);
    }

    public async updateRootData() {
        this._loadingNewData.set(true)
        const alldf = await this.executor.getAllDataFrames();

        // only update if we have detected dataframes
        if (!_.isEmpty(alldf)) {
            const colPromise = this.fetchColumnPromises(alldf);

            colPromise.then(result => {
                const currentColumnProfiles = get(this._columnProfiles)

                // TODO compare these to result and update the execution count if necessary

                this._columnProfiles.set(result);
                this._loadingNewData.set(false);
            });
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
        dfColMap: IDFColMap): Promise<IColumnProfileMap> {
        const colProfileMap: IColumnProfileMap = {};
        const alldf_names = Object.keys(dfColMap);

        const resolved_profiles = await Promise.all(
            alldf_names.map((dfName: string) => {
                return this.getColProfiles(dfName, dfColMap);
            })
        );

        alldf_names.forEach((dfName, index) => {
            colProfileMap[dfName] = resolved_profiles[index];
        });
        return colProfileMap;
    }

    private async getColProfiles(
        dfName: string,
        dfColMap: IDFColMap
    ): Promise<IColumnProfileWrapper> {
        const shape = await this.executor.getShape(dfName);
        const colMetaInfoArr = dfColMap[dfName].columns;
        const resultData: ColumnProfileData[] = [];

        for (let j = 0; j < colMetaInfoArr.length; j++) {
            const ci = colMetaInfoArr[j];
            const col_name = ci.col_name;
            const col_type = ci.col_type;

            // model calls
            const rowVC = await this.executor.getValueCounts(dfName, col_name);
            const colMd = await this.executor.getColMeta(dfName, col_name);

            const cd: ColumnProfileData = {
                name: col_name,
                type: col_type,
                summary: {
                    cardinality: colMd.numUnique,
                    topK: rowVC
                },
                nullCount: colMd.nullCount,
                example: rowVC[0]?.value
            };

            // need at least 1 row to calculate these
            if (shape[0] > 0) {
                if (NUMERICS.has(col_type)) {
                    const chartData = await this.executor.getQuantBinnedData(dfName, col_name);
                    const statistics = await this.executor.getQuantMeta(dfName, col_name);

                    cd.summary.statistics = statistics;
                    cd.summary.histogram = chartData;
                } else if (TIMESTAMPS.has(col_type)) {
                    const chartData = await this.executor.getTempBinnedData(dfName, col_name);
                    cd.summary.histogram = chartData;
                    const interval = await this.executor.getTempInterval(dfName, col_name);

                    // get max and min and calculate interval
                    const minDate = chartData[0]?.low
                        ? new Date(chartData[0].low * 1000)
                        : undefined;

                    const maxDate = chartData[chartData.length - 1]?.high
                        ? new Date(chartData[chartData.length - 1].high * 1000)
                        : undefined;

                    // Rollup to the right edge of each bin, except for 1st bin
                    const rolledUp: TimeBin[] = chartData.map(d => ({
                        ts: new Date(d.high * 1000),
                        count: d.count
                    }));

                    if (rolledUp[0]) {
                        rolledUp[0].ts = minDate;
                    }

                    const timeSummary: TimeColumnSummary = {
                        interval,
                        rollup: {
                            results: rolledUp,
                            spark: rolledUp,
                            timeRange: {
                                start: minDate,
                                end: maxDate,
                                interval: interval
                            }
                        }
                    };

                    cd.summary.timeSummary = timeSummary;
                }
            }


            resultData.push(cd);
        }

        return { profile: resultData, shape: shape };
    }

}
