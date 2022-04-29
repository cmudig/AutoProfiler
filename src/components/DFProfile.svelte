<script lang="ts">
    import ColumnProfile from './rill-lib/ColumnProfile.svelte';
    import ExpanderButton from './rill-lib/nav/ExpanderButton.svelte';
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

    // view variables
    let profileWidth: number;
    let expanded = true;

    async function getColProfiles(
        colMetaInfoArr: IColTypeTuple[]
    ): Promise<ColumnProfileData[]> {
        // console.log('[DFPROFILE] Getting col profiles');
        shape = await profileModel.getShape(dfName, colInfo);

        let resultData: ColumnProfileData[] = [];

        for (let i = 0; i < colMetaInfoArr.length; i++) {
            let ci = colMetaInfoArr[i];
            let col_name = ci.col_name;
            let col_type = ci.col_type;

            console.log('[DFPROFILE] Getting data for column: ', col_name);

            // model calls

            let rowVC = await profileModel.getValueCounts(dfName, col_name);
            let colMd = await profileModel.getColMeta(dfName, col_name);

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
                let chartData = await profileModel.getQuantBinnedData(
                    dfName,
                    col_name
                );
                let statistics = await profileModel.getQuantMeta(
                    dfName,
                    col_name
                );

                cd.summary.statistics = statistics;
                cd.summary.histogram = chartData;
            }

            resultData.push(cd);
        }

        console.log('[DFPROFILE] FINISHED getting col profiles', resultData);

        return new Promise<ColumnProfileData[]>(resolve => resolve(resultData));
    }

    $: columnProfiles = getColProfiles(colInfo);
</script>

<div>
    {#await columnProfiles}
        <CollapsibleCard bind:open={expanded}>
            <div slot="header" class="dfprofile-header">
                <div class="inline-block">
                    <ExpanderButton rotated={expanded} />
                </div>
                <p class="inline-block font-bold">{dfName}</p>
                <p class="inline-block text-red-800">Loading...</p>
            </div>

            <!-- <div slot="body" class="dfprofile-body">Loading...</div> -->
        </CollapsibleCard>
    {:then columnProfiles}
        <CollapsibleCard bind:open={expanded}>
            <div slot="header" class="dfprofile-header">
                <div class="inline-block">
                    <ExpanderButton rotated={expanded} />
                </div>
                <p class="inline-block font-bold">{dfName}</p>
                <p class="inline-block">
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
    .col-profiles {
        width: 100%;
    }

    .dfprofile-header {
        margin: 0;
        padding: 0.5em;
        /* border: 1px solid #9e9e9e; */
        /* border-radius: 5px; */
        /* background: rgb(244, 244, 244); */
        /* transition: border-radius 0.5s step-end; */
    }

    /* :global(.card.open) .dfprofile-header {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        transition: border-radius 0.5s step-start;
    } */

    .dfprofile-body {
        /* padding: 1em; */
        /* border: 1px solid #9e9e9e;
        border-top: 0px; */
        display: flex;
        /* border-radius: 5px; */
        /* border-top-left-radius: 0;
        border-top-right-radius: 0; */
    }
</style>
