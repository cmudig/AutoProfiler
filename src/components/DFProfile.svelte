<script lang="ts">
    import ColumnPreview from './ColumnPreview.svelte';
    import ColumnProfile from './rill-lib/ColumnProfile.svelte'
    import type { IColTypeTuple } from '../dataAPI/exchangeInterfaces';
    import type { ProfileModel } from '../ProfileModel';
    import { CollapsibleCard } from 'svelte-collapsible';

    export let dfName: string;
    export let colInfo: IColTypeTuple[];
    export let profileModel: ProfileModel;

    // Locals
    let shape: Promise<number[]>;

    $: console.log('[SVELTE] Making DFProfile for ', dfName, ' with ', colInfo);

    // locals
    $: shape = profileModel.getShape(dfName, colInfo); // colInfo isnt actually necessary for the call but I want this to re-run if colInfo updates, so I'm passing it in anyway
</script>

<div class="dataframe-profile">
    <CollapsibleCard open={false}>
        <div slot="header" class="dfprofile-header">
            <h2>{dfName}</h2>

            <p class="metadata">
                {#await shape}
                    <p>? x ?</p>
                {:then shape}
                    <p>{shape[0]} x {shape[1]}</p>
                {:catch error}
                    <p>ERROR getting shape!</p>
                {/await}
            </p>
        </div>

        <div slot="body" class="dfprofile-body">
            <div class="col-profiles">
                <!-- do async at this level likely, or break into comps so can get each async -->
                {#each colInfo as colData, idx}
                    <!-- <ColumnPreview
                        col_type={colData.col_type}
                        columnName={colData.col_name}
                        {dfName}
                        {profileModel}
                        {idx}
                    /> -->

                    <ColumnProfile>
                    </ColumnProfile>
                {/each}
            </div>
        </div>
    </CollapsibleCard>
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
