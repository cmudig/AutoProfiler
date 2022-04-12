<script lang="ts">
  import ColumnPreview from './ColumnPreview.svelte';
  import type { IColTypeTuple } from '../dataAPI/exchangeInterfaces';

  import { dataAccessor } from '../stores';

  export let dfName: string;
  export let colInfo: IColTypeTuple[];

  // locals
  let shape = $dataAccessor.getShape(dfName);
</script>

<div id="dataframe-profile">
  <div id="metadata">
    {#await shape}
      <p><b>{dfName}</b> has ? rows and ? columns</p>
    {:then shape}
      <p><b>{dfName}</b> has {shape[0]} rows and {shape[1]} columns</p>
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
        />
      </div>
    {/each}
  </div>
</div>

<style>
</style>
