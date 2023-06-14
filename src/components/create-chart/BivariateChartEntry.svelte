<script lang="ts">
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import BiHistogram from '../viz/bivariate/BiHistogram.svelte';
    import BiLine from '../viz/bivariate/BiLine.svelte';
    import BivariateIcon from '../icons/BivariateIcon.svelte';
    import Delete from '../icons/Delete.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import ColumnEntry from '../ColumnEntry.svelte';
    import type {
        TimeOffset,
        AggrType,
        IBivariateData
    } from '../../common/exchangeInterfaces';

    export let biData: IBivariateData;
    export let xLabel: string;
    export let yLabel: string;
    export let timeOffset: TimeOffset = 'Y';
    export let aggrType: AggrType = 'count';

    let active = false;
    $: title = `${xLabel} vs ${yLabel}`;

    const offsetAliases: Record<string, TimeOffset> = {
        year: 'Y',
        month: 'M',
        week: 'W',
        day: 'D',
        hour: 'H',
        minute: 'T',
        second: 'S'
    };

    const dispatch = createEventDispatcher();
</script>

<ColumnEntry hideRight={true} bind:active hoverKey={title} dfName={''}>
    <svelte:fragment slot="icon">
        <Tooltip location="left" distance={16}>
            <div class="text-gray-400">
                <BivariateIcon size="16px" />
            </div>

            <TooltipContent slot="tooltip-content">
                Bivariate chart
            </TooltipContent>
        </Tooltip>
    </svelte:fragment>

    <svelte:fragment slot="left">
        {title}
    </svelte:fragment>

    <svelte:fragment slot="details">
        {#if active}
            <div
                transition:slide|local={{ duration: 200 }}
                class="pt-1 pb-1 pl-3 pr-3 w-full"
            >
                {#if biData.data.length !== 0}
                    {#if biData.chartType === 'histogram'}
                        <BiHistogram
                            data={biData.data}
                            xLabel={yLabel}
                            yLabel={xLabel}
                        />
                    {:else if biData.chartType === 'linechart'}
                        <BiLine data={biData.data} {xLabel} {yLabel} />
                    {/if}
                    <div class="flex" style="z-index:1">
                        <select
                            class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                            bind:value={aggrType}
                            on:change={() => {
                                dispatch('selectAggrType', {
                                    typ: aggrType
                                });
                            }}
                        >
                            {#each ['count', 'mean', 'sum', 'min', 'max'] as typ}
                                <option value={typ}>{typ}</option>
                            {/each}
                        </select>

                        <div class="grow" />
                        {#if biData.chartType === 'linechart'}
                            <select
                                class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                                bind:value={timeOffset}
                                on:change={() => {
                                    dispatch('selectTimeOffset', {
                                        timeOffset
                                    });
                                }}
                            >
                                {#each Object.entries(offsetAliases) as [key, value]}
                                    <option {value}>{key}</option>
                                {/each}
                            </select>
                        {/if}

                        <div class="grow" />
                        <div class="flex rounded">
                            <Tooltip
                                location="right"
                                alignment="center"
                                distance={8}
                            >
                                <button
                                    class={'grid place-items-center rounded hover:bg-gray-100 text-gray-400'}
                                    style="width: 16px; height: 16px;"
                                    on:click={() => {
                                        dispatch('delete');
                                    }}
                                >
                                    <Delete size="16px" />
                                </button>
                                <TooltipContent slot="tooltip-content">
                                    Delete
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                {:else}
                    <div class="w-full">
                        No aggregated data to show for the columns.
                    </div>
                {/if}
            </div>
        {/if}
    </svelte:fragment>
</ColumnEntry>
