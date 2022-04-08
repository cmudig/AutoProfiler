<script lang="ts">
  import ColumnPreview from './ColumnPreview.svelte';
  import type ArqueroExecutor from '../jupyter-hooks/DataWrapper';

  // imports
  import { notebookStore, dfMapStore } from '../stores';
  export let dataHandler: ArqueroExecutor;

  // locals
  let shape = dataHandler.getShape();
  let types = dataHandler.getColumnTypes();
  let lang = $notebookStore?.language || '?';
  let cell = $notebookStore?.activeCell;
</script>

<div id="results-graphs-wrapper">
  <div id="header-icon" />
  <h1>Data Profiler</h1>

  <div id="notebookInfo">
    <h4>{$notebookStore?.name}</h4>
    <p>is a <b>{lang}</b> notebook</p>
  </div>

  <div>
    <h5>{`you hath selected a ${cell?.type} cell:`}</h5>
    <p class="code">{`${cell?.text}`}</p>
  </div>

  <div id="metadata">
    <p>Data has {shape[0]} rows and {shape[1]} columns</p>
  </div>

  <div id="profiles">
    <!-- do async at this level likely, or break into comps so can get each async -->
    {#each Object.keys(types) as col_name}
      <div>
        <ColumnPreview
          type={types[col_name]}
          columnName={col_name}
          {dataHandler}
        />
      </div>
    {/each}
  </div>
</div>

<style>
</style>
