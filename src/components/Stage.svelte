<script lang="ts">
    import RootComp from './RootComp.svelte';
    import { dataAccessor } from '../stores';

    // let x = 5
</script>

<div>
    {#await $dataAccessor.ready}
        Waiting on data accessor thing...
    {:then x}
        <RootComp />
    {/await}
</div>
