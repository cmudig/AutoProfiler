import { type Writable, type Readable, writable, derived } from 'svelte/store';
import type {
    IDFColMap,
    IColumnProfileMap,
    ColumnProfileData,
    IColumnProfileWrapper
} from './common/exchangeInterfaces';
import {
    NUMERICS,
    TIMESTAMPS
} from './components/data-types/pandas-data-types';
import type { ProfileModel } from './dataAPI/ProfileModel';

// UI stores
export const currentHoveredCol: Writable<string> = writable(undefined)

// ~~~~~~~~~~~ Backend data Stores ~~~~~~~~~~~~~~~~
export const dataFramesAndCols: Writable<IDFColMap> = writable(undefined);
export const profileModel: Writable<ProfileModel> = writable(undefined);
export const isLoadingNewData: Writable<boolean> = writable(false);

export const columnProfiles: Readable<IColumnProfileMap> = derived(
    [dataFramesAndCols, profileModel],

    ([$dataFramesAndCols, $profileModel], set) => {
        if ($dataFramesAndCols && $profileModel) {
            isLoadingNewData.set(true);
            const colPromise = fetchColumnPromises(
                $dataFramesAndCols,
                $profileModel
            );
            colPromise.then(result => {
                set(result);
                isLoadingNewData.set(false);
            });
        } else {
            set(undefined);
        }
    },
    undefined // default value
);

async function fetchColumnPromises(
    dfColMap: IDFColMap,
    model: ProfileModel
): Promise<IColumnProfileMap> {
    //, set: (arg0: any) => void) {
    const colProfileMap: IColumnProfileMap = {};
    const alldf_names = Object.keys(dfColMap);

    // TODO since this is a promise, it reloads every dataframe each time rather than only those that change.
    // (I guess stores update everything with new promises)
    // Maybe there is a way to not use a promise or only make calls when we know the dataframe has changed?

    const resolved_profiles = await Promise.all(
        alldf_names.map((dfName: string) => {
            return getColProfiles(dfName, dfColMap, model);
        })
    );

    alldf_names.forEach((dfName, index) => {
        colProfileMap[dfName] = resolved_profiles[index];
    });
    return colProfileMap;
}

async function getColProfiles(
    dfName: string,
    dfColMap: IDFColMap,
    model: ProfileModel
): Promise<IColumnProfileWrapper> {
    const shape = await model.getShape(dfName);
    const colMetaInfoArr = dfColMap[dfName].columns;
    const resultData: ColumnProfileData[] = [];

    for (let j = 0; j < colMetaInfoArr.length; j++) {
        const ci = colMetaInfoArr[j];
        const col_name = ci.col_name;
        const col_type = ci.col_type;

        // model calls
        const rowVC = await model.getValueCounts(dfName, col_name);
        const colMd = await model.getColMeta(dfName, col_name);

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

        if (NUMERICS.has(col_type)) {
            const chartData = await model.getQuantBinnedData(dfName, col_name);
            const statistics = await model.getQuantMeta(dfName, col_name);

            cd.summary.statistics = statistics;
            cd.summary.histogram = chartData;
        } else if (TIMESTAMPS.has(col_type)) {
            const chartData = await model.getTempBinnedData(dfName, col_name);
            cd.summary.histogram = chartData;

            const interval = await model.getTempInterval(dfName, col_name);
            cd.summary.interval = interval;

            // smallestTimeGrain
            // const timeGrain = await model.getTimeGrain(dfName, col_name);
            // cd.summary.estimatedSmallestTimeGrain = timeGrain;
        }

        resultData.push(cd);
    }

    // console.log('[getColProfiles] FINISHED getting col profiles', resultData);
    return { profile: resultData, shape: shape };
}
