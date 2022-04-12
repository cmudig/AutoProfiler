<script lang="ts">
  import DFProfile from './DFProfile.svelte';
  import {dataAccessor} from '../stores';

  let allDataFrames = $dataAccessor.getAllDataFrames();
  let lang = $dataAccessor?.language || '?';
  
</script>

<main>
  <div id="header-icon" />
  <h1>Dataframe Profiler</h1>
  <p>All Pandas dataframes in your jupyter notebook will be profiled below.</p>
  <div id="notebookInfo">
    <p>{$dataAccessor?.name} is a <b>{lang}</b> notebook</p>
  </div>

  <!-- <div>
    <h5>{`you hath selected a ${cell?.type} cell:`}</h5>
    <p class="code">{`${cell?.text}`}</p>
  </div> -->

  {#await allDataFrames}
    <div class="load-wrapper">Loading...</div>
  {:then allDataFrames}
    {#each Object.keys(allDataFrames) as dfName}
      <DFProfile {dfName} colInfo={allDataFrames[dfName]} />
      
    {/each}
  {:catch error}
    <h2 style="color: red">Unable to get data!</h2>
    <p style="color: red">{error.message}</p>
  {/await}
</main>

<style>
  main {
    /* text-align: center; */
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
