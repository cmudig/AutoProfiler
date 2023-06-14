<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BiHistogram from '../viz/bivariate/BiHistogram.svelte';
    import BiLine from '../viz/bivariate/BiLine.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import type { IBivariateData } from '../../common/exchangeInterfaces';
    import EditIcon from '../icons/EditIcon.svelte';

    export let biData: IBivariateData;
    export let allowEdit = false;

    const dispatch = createEventDispatcher();
</script>

{#if biData.data.length !== 0}
    {#if biData.chartType === 'histogram'}
        <BiHistogram
            data={biData.data}
            xLabel={`${biData.yColumn.colName} (${biData.aggrType})`}
            yLabel={biData.xColumn.colName}
        />
    {:else if biData.chartType === 'linechart'}
        <BiLine
            data={biData.data}
            xLabel={biData.xColumn.colName}
            yLabel={`${biData.yColumn.colName} (${biData.aggrType})`}
        />
    {/if}

    {#if allowEdit}
        <div class="flex justify-end" style="z-index:1">
            <Tooltip location="left" alignment="center" distance={8}>
                <button
                    class={'flex items-center text-gray-500 gap-1 p-1 hover:bg-gray-100'}
                    on:click={() => {
                        dispatch('triggerEdit');
                    }}
                >
                    <p>Edit</p>
                    <EditIcon size="14px" />
                </button>
                <TooltipContent slot="tooltip-content">Edit</TooltipContent>
            </Tooltip>
        </div>
    {/if}
{:else}
    <div class="w-full">No aggregated data to show for the columns.</div>
{/if}
