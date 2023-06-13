<script lang="ts">
    import { slide } from 'svelte/transition';
    import ColumnEntry from './ColumnEntry.svelte';
    import DataTypeIcon from './data-types/DataTypeIcon.svelte';
    import BarAndLabel from './viz//BarAndLabel.svelte';
    import { config, getSummarySize } from './utils/sizes';
    import {
        formatInteger,
        formatCompactInteger,
        formatPercentage
    } from './utils/formatters';
    import { DATA_TYPE_COLORS } from './data-types/pandas-data-types';
    import Tooltip from './tooltip/Tooltip.svelte';
    import TooltipContent from './tooltip/TooltipContent.svelte';
    import Histogram from './viz/histogram/SmallHistogram.svelte';
    import type { AnySummary } from '../common/exchangeInterfaces';
    import {
        isNumericSummary,
        isCategoricalSummary,
        isTemporalSummary,
        isBooleanSummary
    } from '../common/exchangeInterfaces';
    import { showIndex } from '../stores';
    import VizOrStats from './fact-panel/VizOrStats.svelte';

    // props
    export let dfName: string;
    export let colName: string;
    export let type: string;
    export let summary: AnySummary;
    export let totalRows: number;
    export let nullCount: number;
    export let containerWidth: number;
    export let hideRight = false;
    export let isIndex = false;

    // locals
    let active = false;
    let wrapperDivWidth: number;

    $: summaryWidthSize = getSummarySize(containerWidth);

    $: cardinalityFormatter =
        containerWidth > config.compactBreakpoint
            ? formatInteger
            : formatCompactInteger;
</script>

{#if !isIndex || (isIndex && $showIndex)}
    <!-- pl-10 -->
    <ColumnEntry {hideRight} bind:active hoverKey={colName} {dfName}>
        <svelte:fragment slot="icon">
            <Tooltip location="left" distance={16}>
                <DataTypeIcon {type} />

                <TooltipContent slot="tooltip-content">
                    {type}
                </TooltipContent>
            </Tooltip>
        </svelte:fragment>

        <svelte:fragment slot="left">
            {#if isIndex}
                <Tooltip location="right" distance={16}>
                    <div
                        class="text-ellipsis overflow-hidden whitespace-nowrap italic"
                    >
                        INDEX
                        {#if colName}
                            ({colName})
                        {/if}
                    </div>

                    <TooltipContent slot="tooltip-content">
                        The dataframe index <span class="font-bold"
                            >{`${dfName}.index`}</span
                        >
                    </TooltipContent>
                </Tooltip>
            {:else}
                <div
                    class="text-ellipsis overflow-hidden whitespace-nowrap"
                    title={colName.length > 15 ? colName : ''}
                >
                    {colName}
                </div>
            {/if}
        </svelte:fragment>

        <svelte:fragment slot="right">
            <div class="flex gap-2 items-center">
                <div
                    class="flex items-center"
                    style:width="{summaryWidthSize}px"
                >
                    <!-- Distribution preview -->
                    <!-- check to see if the summary has cardinality. Otherwise do not show these values.-->
                    {#if totalRows}
                        {#if isCategoricalSummary(summary) || isBooleanSummary(summary)}
                            <Tooltip
                                location="bottom"
                                alignment="center"
                                distance={8}
                            >
                                <BarAndLabel
                                    color={DATA_TYPE_COLORS[type].bgClass}
                                    value={summary?.cardinality / totalRows}
                                >
                                    |{cardinalityFormatter(
                                        summary?.cardinality
                                    )}|
                                </BarAndLabel>
                                <TooltipContent slot="tooltip-content">
                                    {cardinalityFormatter(summary?.cardinality)}
                                    unique values
                                </TooltipContent>
                            </Tooltip>
                        {:else if isNumericSummary(summary) && summary?.histogram?.length > 0}
                            <Histogram
                                data={summary.histogram}
                                width={summaryWidthSize}
                                height={18}
                                fillColor={DATA_TYPE_COLORS[type].vizFillClass}
                                baselineStrokeColor={DATA_TYPE_COLORS[type]
                                    .vizStrokeClass}
                            />
                        {:else if isTemporalSummary(summary) && summary?.histogram?.length > 0}
                            <Histogram
                                data={summary.histogram}
                                width={summaryWidthSize}
                                height={18}
                                fillColor={DATA_TYPE_COLORS[type].vizFillClass}
                                baselineStrokeColor={DATA_TYPE_COLORS[type]
                                    .vizStrokeClass}
                            />
                        {/if}
                    {/if}
                </div>

                <div style:width="{config.nullPercentageWidth}px">
                    <!-- Number of nulls -->
                    {#if totalRows !== 0 && totalRows !== undefined && nullCount !== undefined}
                        <Tooltip
                            location="bottom"
                            alignment="center"
                            distance={8}
                        >
                            <BarAndLabel
                                showBackground={nullCount !== 0}
                                color={'numNullsColor'}
                                value={nullCount / totalRows || 0}
                            >
                                <span class:text-gray-300={nullCount === 0}
                                    >∅ {formatPercentage(
                                        nullCount / totalRows
                                    )}</span
                                >
                            </BarAndLabel>
                            <TooltipContent slot="tooltip-content">
                                <svelte:fragment slot="title">
                                    what percentage of values are null?
                                </svelte:fragment>
                                {#if nullCount > 0}
                                    {formatPercentage(nullCount / totalRows)} of
                                    the values are null
                                {:else}
                                    No null values in this column
                                {/if}
                            </TooltipContent>
                        </Tooltip>
                    {/if}
                </div>
            </div>
        </svelte:fragment>

        <svelte:fragment slot="details">
            {#if active}
                <div
                    transition:slide|local={{ duration: 200 }}
                    class="pt-1 pb-1 w-full"
                >
                    <div bind:clientWidth={wrapperDivWidth}>
                        {#if totalRows !== 0 && nullCount !== totalRows}
                            <VizOrStats
                                {dfName}
                                {colName}
                                {totalRows}
                                {type}
                                {summary}
                                {isIndex}
                                {wrapperDivWidth}
                                {nullCount}
                            />
                        {:else}
                            <div class="pl-4">
                                <p>No values to show for this column</p>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </svelte:fragment>
    </ColumnEntry>
{/if}
