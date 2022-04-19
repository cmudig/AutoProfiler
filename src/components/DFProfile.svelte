<script lang="ts">
    import ColumnPreview from './ColumnPreview.svelte';
    import type { IColTypeTuple } from '../dataAPI/exchangeInterfaces';
    import type { ProfileModel } from '../ProfileModel';

    export let dfName: string;
    export let colInfo: IColTypeTuple[];
    export let profileModel: ProfileModel;

    console.log('Making DFProfile for ', dfName, ' with ', colInfo);

    // locals
    let shape: Promise<number[]> = profileModel.getShape(dfName);
</script>

<div id="dataframe-profile">
    <div id="metadata">
        <h2>{dfName}</h2>
        {#await shape}
            <p>has ? rows and ? columns</p>
        {:then shape}
            <p>has {shape[0]} rows and {shape[1]} columns</p>
        {:catch error}
            <p>ERROR getting shape for <b>{dfName}</b>.</p>
        {/await}
    </div>

    <div id="col-profiles">
        <!-- do async at this level likely, or break into comps so can get each async -->
        {#each colInfo as colData}
            <div>
                <ColumnPreview
                    type={colData.col_type}
                    columnName={colData.col_name}
                    {dfName}
                    {profileModel}
                />
            </div>
        {/each}
    </div>
</div>

<style>
    .metaData {
        margin-top: 10px;
    }
</style>
