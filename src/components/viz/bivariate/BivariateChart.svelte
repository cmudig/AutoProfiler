<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import BiHistogram from './BiHistogram.svelte';
    import BiLine from './BiLine.svelte';

    import BivariateIcon from '../../icons/BivariateIcon.svelte';

    import Delete from '../../icons/Delete.svelte';
    import Tooltip from '../../tooltip/Tooltip.svelte';
    import TooltipContent from '../../tooltip/TooltipContent.svelte';

    export let biData;

    console.log(biData);

    //for chart
    export let xLabel: string;
    export let yLabel: string;
    export let timeOffset: string; // such as "Y","M"

    let aggrType: string = 'count';

    // let showAggrMenu = false;
    // let showTimeStepMenu = false;
    let collapse = false;

    let offsetAliases = {
        year: 'Y',
        month: 'M',
        week: 'W',
        day: 'D',
        hour: 'H',
        minute: 'T',
        second: 'S'
    };

    const dispatch = createEventDispatcher();

    const onSelectAggrType = () => {
        dispatch('selectAggrType', {
            typ: aggrType
        });
    };

    const onDelete = () => {
        dispatch('delete');
    };

    const onSelectTimeOffset = () => {
        dispatch('selectTimeOffset', {
            timeOffset: offsetAliases[timestep]
        });
    };

    let timestep = Object.keys(offsetAliases).filter(
        d => offsetAliases[d] === timeOffset
    )[0];
</script>

<div>
    <button
        class="w-full bg-gray-100 flex gap-2 pl-2 pr-2"
        style="margin-bottom:2px"
        on:click={() => {
            collapse = !collapse;
        }}
        class:font-bold={!collapse}
    >
        <BivariateIcon size="16px" />
        <span>{xLabel} vs {yLabel}</span>
    </button>
    {#if !collapse}
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
                <!-- <div
                class="rounded border border-solid cursor-grabbing variable pl-1 pr-1"
            >
                Aggregation:
                <span class="aggregation-select">
                    <button
                        on:click={() => {
                            showAggrMenu = !showAggrMenu;
                        }}
                    >
                        {aggrType}
                    </button>
                    {#if showAggrMenu} -->
                <!-- <div
                            class="absolute left-1 mt-2 w-20 origin-top-right rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-gray-50 dark:border-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none transform scale-100"
                            style="z-index:9; cursor:pointer"
                        >
                            {#each ['count', 'mean', 'sum', 'min', 'max'] as typ}
                                <span
                                    class="hover:bg-gray-100 text-gray-700 dark:text-gray-200 block px-2 py-1 text-sm"
                                    on:click={() => {
                                        aggrType = typ;
                                        onSelectAggrType();
                                    }}>{typ}</span
                                >
                            {/each}
                        </div> -->
                <select
                    class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                    bind:value={aggrType}
                    on:change={() => {
                        onSelectAggrType();
                    }}
                >
                    <option value="none" selected disabled hidden
                        >Aggregation Type</option
                    >
                    {#each ['count', 'mean', 'sum', 'min', 'max'] as typ}
                        <option value={typ}>{typ}</option>
                    {/each}
                </select>
                <!-- {/if}
                </span>
            </div> -->

                <div class="grow" />
                {#if biData.chartType === 'linechart'}
                    <!-- <div class="rounded border border-solid variable pl-1 pr-1"> -->
                    <!-- TimeStep:
                    <span class="timestep-select">
                        <button
                            on:click={event => {
                                event.stopPropagation();
                                showTimeStepMenu = !showTimeStepMenu;
                            }}
                            >{timestep}
                        </button> -->
                    <!-- {#if showTimeStepMenu} -->
                    <!-- <div
                                class="absolute mt-2 w-20 origin-top-right rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-gray-50 dark:border-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none transform scale-100"
                                style="z-index:9; cursor:pointer"
                            >
                                {#each ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'] as step}
                                    <span
                                        class="text-gray-700 hover:bg-gray-100 dark:text-gray-200 block px-2 py-1 text-sm"
                                        on:click={event => {
                                            event.stopPropagation();
                                            timestep = step;
                                            onSelectTimeOffset();
                                        }}>{step}</span
                                    >
                                {/each}
                            </div> -->
                    <select
                        class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                        bind:value={timestep}
                        on:change={() => {
                            onSelectTimeOffset();
                        }}
                    >
                        <option value="none" selected disabled hidden
                            >TimeStep</option
                        >
                        {#each ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'] as step}
                            <option value={step}>{step}</option>
                        {/each}
                    </select>
                    <!-- {/if} -->
                    <!-- </span> -->
                    <!-- </div> -->
                {/if}

                <div class="grow" />
                <div class="flex rounded">
                    <Tooltip location="right" alignment="center" distance={8}>
                        <button
                            class={'grid place-items-center rounded hover:bg-gray-100 text-gray-400'}
                            style="width: 16px; height: 16px;"
                            on:click={() => {
                                onDelete();
                            }}
                        >
                            <Delete size="16px" />
                        </button>
                        <TooltipContent slot="tooltip-content">
                            Delete
                        </TooltipContent>
                    </Tooltip>
                    <!-- <button
                    class="flex pl-2 pr-2 text-gray-500 hover:bg-gray-100"
                    on:click={() => {
                        onDelete();
                    }}
                    >
                    
                    Delete
                </button> -->
                </div>
            </div>
        {:else}
            <div class="w-full">
                <div class="pt-1 pb-1 w-full">
                    <div style="position: relative;">
                        <div class="pl-4">
                            <p>No aggregated data to show for the columns</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .variable {
        min-width: 80px;
        height: 24px;
        cursor: grab;
    }

    .aggregation-select {
        background-color: #bdbdbd;
        font-size: 10px;
    }
    .timestep-select {
        background-color: #bdbdbd;
        font-size: 10px;
    }
</style>
