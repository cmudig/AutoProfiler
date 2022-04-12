<script lang="ts">
    import DFProfile from './DFProfile.svelte';
    import { dataAccessor} from '../stores';

    
    let allDataFrames = $dataAccessor?.getAllDataFrames();
    let lang = $dataAccessor?.language || '?';
    
    $: console.log("In the rootComp dataAccessor is: ", dataAccessor)
    $: console.log("In the rootComp allDataFrames is: ", allDataFrames)
</script>

<main>
    {#if $dataAccessor}

        <!-- <div id="header-icon" /> -->
        <h1>Dataframe Profiler</h1>
        <p>
            All Pandas dataframes in your jupyter notebook will be profiled
            below.
        </p>
        <div>
            <p>{$dataAccessor?.name} is a <b>{lang}</b> notebook</p>
        </div>

        {#await allDataFrames}
            <div class="load-wrapper">Loading...</div>
        {:then allDataFrames}
            {#if allDataFrames}
                {#each Object.keys(allDataFrames) as dfName}
                    <DFProfile {dfName} colInfo={allDataFrames[dfName]} />
                {/each}
            {:else}
              <p> allDataFrames is {allDataFrames}</p>
            {/if}
        {:catch error}
            <h2 style="color: red">Unable to get data!</h2>
            <p style="color: red">{error.message}</p>
        {/await}
    {:else}
        <p>Not loaded yet!</p>
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
