<script lang="ts">
    import BivariateButton from '../icons/BivariateButton.svelte';

    export let handleAddChart: () => void;
</script>

<button
    class="flex items-center gap-1 hover:bg-gray-100 text-gray-400 pl-2 pr-2"
    on:click={handleAddChart}
>
    <BivariateButton size="16px" />
    <p class="text-gray-500">Add Chart</p>
</button>
