<script lang="ts">
  import Profiler from './Profiler.svelte';

  export let dataHandler; // promise of arquero table
</script>

<main>
  {#await dataHandler}
    <div class="load-wrapper">Loading...</div>
  {:then dataHandler}
    <Profiler {dataHandler} />
  {:catch error}
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
