<script lang="ts">
    import ColumnProfile from './rill-lib/ColumnProfile.svelte';
    import type {
        IColTypeTuple,
        ColumnProfileData
    } from '../dataAPI/exchangeInterfaces';
    import type { ProfileModel } from '../ProfileModel';
    import { CollapsibleCard } from 'svelte-collapsible';
    import { NUMERICS } from './rill-lib/data-types/pandas-data-types';

    export let dfName: string;
    $: console.log('[SVELTE] Making DFProfile for ', dfName, ' with ', colInfo);
    export let colInfo: IColTypeTuple[];
    export let profileModel: ProfileModel;

    // Locals
    let shape: number[];
    let columnProfiles: Promise<ColumnProfileData[]>;
    let previewView = 'summaries';
    let profileWidth: number;

    async function getColProfiles(
        colMetaInfoArr: IColTypeTuple[]
    ): Promise<ColumnProfileData[]> {
        shape = await profileModel.getShape(dfName, colInfo);
        // TODO get data for ColumnProfileData

        let resultData: ColumnProfileData[] = [];

        for (let i = 0; i < colMetaInfoArr.length; i++) {
            let ci = colMetaInfoArr[i];
            let col_name = ci.col_name;
            let col_type = ci.col_type;

            // model calls

            let headRows = await profileModel.getColHeadRows(dfName, col_name);
            let colMd = await profileModel.getColMeta(dfName, col_name);

            let cd: ColumnProfileData = {
                name: col_name,
                type: col_type,
                summary: {
                    cardinality: shape[0],
                    topK: headRows
                },
                nullCount: colMd.nullCount,
                example: headRows[0]
            };

            if (NUMERICS.has(col_type)) {
                let chartData = await profileModel.getQuantBinnedData(
                    dfName,
                    col_name
                );
                let statistics = await profileModel.getQuantMeta(
                    dfName,
                    col_name
                );

                cd['statistics'] = statistics;
                cd['histogram'] = chartData;
            }

            resultData.push(cd);
        }

        return resultData;
    }

    $: columnProfiles = getColProfiles(colInfo);

    // data updates
    // $: shape = profileModel.getShape(dfName, colInfo); // colInfo isnt actually necessary for the call but I want this to re-run if colInfo updates, so I'm passing it in anyway
</script>

<div class="dataframe-profile">
    {#await columnProfiles}
        <CollapsibleCard open={false}>
            <div slot="header" class="dfprofile-header">
                <h2>{dfName}</h2>
                <p class="metadata">Loading...</p>
            </div>

            <div slot="body" class="dfprofile-body">Loading...</div>
        </CollapsibleCard>
    {:then columnProfiles}
        <CollapsibleCard open={false}>
            <div slot="header" class="dfprofile-header">
                <h2>{dfName}</h2>

                <p class="metadata">
                    {shape[0]} x {shape[1]}
                </p>
            </div>

            <div slot="body" class="dfprofile-body">
                <div bind:clientWidth={profileWidth} class="col-profiles">
                    {#each columnProfiles as column}
                        <ColumnProfile
                            example={column.example}
                            name={column.name}
                            type={column.type}
                            summary={column.summary}
                            nullCount={column.nullCount}
                            containerWidth={profileWidth}
                            view={previewView}
                            totalRows={shape[0]}
                        />
                    {/each}
                </div>
            </div>
        </CollapsibleCard>
    {/await}
</div>

<style>
    .dataframe-profile {
        margin-bottom: 1em;
    }

    .col-profiles {
        width: 100%;
    }

    .dfprofile-header {
        margin: 0;
        padding: 0.5em;
        border: 1px solid #9e9e9e;
        border-radius: 5px;
        background: rgb(244, 244, 244);
        transition: border-radius 0.5s step-end;
    }

    :global(.card.open) .dfprofile-header {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        transition: border-radius 0.5s step-start;
    }

    .dfprofile-body {
        /* padding: 1em; */
        border: 1px solid #9e9e9e;
        border-top: 0px;
        display: flex;
        border-radius: 5px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .metadata {
        display: inline-block;
    }

    .dfprofile-header h2 {
        display: inline-block;
    }
</style>
