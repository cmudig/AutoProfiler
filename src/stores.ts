import { type Writable, type Readable, writable, derived } from 'svelte/store';
import type { IDFColMap, IColumnProfileMap, ColumnProfileData } from './common/exchangeInterfaces';
import { NUMERICS } from './components/data-types/pandas-data-types';
import type { ProfileModel } from "./dataAPI/ProfileModel";

// ~~~~~~~~~~~ Stores ~~~~~~~~~~~~~~~~
export const dataFramesAndCols: Writable<IDFColMap> = writable(undefined);
export const profileModel: Writable<ProfileModel> = writable(undefined);

export const columnProfiles: Readable<IColumnProfileMap> = derived(
    [dataFramesAndCols, profileModel],

    ([$dataFramesAndCols, $profileModel], set) => {
        if ($dataFramesAndCols && $profileModel)
            getColProfiles($dataFramesAndCols, $profileModel, set)
    },
    undefined // default value
)

async function getColProfiles(dfColMap: IDFColMap, model: ProfileModel, set: (arg0: any) => void) {

    console.log("Updating column stores in getColProfiles!")
    let colProfileMap: IColumnProfileMap = {};
    let alldf_names = Object.keys(dfColMap)

    for (let i = 0; i < alldf_names.length; i++) {
        let dfName = alldf_names[i]

        let shape = await model.getShape(dfName);
        let colMetaInfoArr = dfColMap[dfName].columns
        let resultData: ColumnProfileData[] = [];

        for (let j = 0; j < colMetaInfoArr.length; j++) {
            let ci = colMetaInfoArr[j];
            let col_name = ci.col_name;
            let col_type = ci.col_type;

            console.log('[DFPROFILE] Getting data for column: ', col_name);

            // model calls
            let rowVC = await model.getValueCounts(dfName, col_name);
            let colMd = await model.getColMeta(dfName, col_name);

            let cd: ColumnProfileData = {
                name: col_name,
                type: col_type,
                summary: {
                    cardinality: colMd.numUnique,
                    topK: rowVC
                },
                nullCount: colMd.nullCount,
                example: rowVC[0].value
            };

            if (NUMERICS.has(col_type)) {
                let chartData = await model.getQuantBinnedData(
                    dfName,
                    col_name
                );
                let statistics = await model.getQuantMeta(
                    dfName,
                    col_name
                );

                cd.summary.statistics = statistics;
                cd.summary.histogram = chartData;
            }

            resultData.push(cd);
        }

        console.log('[DFPROFILE] FINISHED getting col profiles', resultData);
        colProfileMap[dfName] = { "profile": resultData, "shape": shape };
    }

    console.log("Setting derived store...", colProfileMap)

    set(colProfileMap)
}