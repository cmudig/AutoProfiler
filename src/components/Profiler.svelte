<script lang="ts">
    import DFProfile from './DFProfile.svelte';
    import { dataFramesAndCols } from '../stores';
    import type { ProfileModel } from '../ProfileModel';

    export let profileModel: ProfileModel;

    $: console.log(
        'In the rootComp dataFramesAndCols is: ',
        $dataFramesAndCols
    );
</script>

<main>
    <h1>Dataframe Profiler</h1>
    <p>
        All Pandas dataframes in your jupyter notebook will be profiled below.
    </p>
    {#if $dataFramesAndCols}
        <!-- <div id="header-icon" /> -->
        <div>
            <p>
                {profileModel.name} is a
                <b>
                    {#await profileModel.language}
                        ?
                    {:then lang}
                        {lang}
                    {/await}
                </b>
                notebook
            </p>
        </div>

        {#each Object.keys($dataFramesAndCols) as dfName}
            <DFProfile
                {dfName}
                colInfo={$dataFramesAndCols[dfName]}
                {profileModel}
            />
        {/each}
    {:else}
        No data (yet).
    {/if}
</main>

<style>
    main {
        /* text-align: center; */
        padding: 1em;
        /* max-width: 240px; */
        margin: 0 auto;
    }
</style>
