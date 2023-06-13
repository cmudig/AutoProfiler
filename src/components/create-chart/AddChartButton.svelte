<script lang="ts">
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import BivariateButton from '../icons/BivariateButton.svelte';

    export let handleToggle: () => void;
</script>

<Tooltip location="right" alignment="center" distance={8}>
    <button
        class={'grid place-items-center rounded hover:bg-gray-100 text-gray-400'}
        style="width: 16px; height: 16px;"
        on:click={handleToggle}
    >
        <BivariateButton size="16px" />
    </button>
    <TooltipContent slot="tooltip-content">Add New Chart</TooltipContent>
</Tooltip>
