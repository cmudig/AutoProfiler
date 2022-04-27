<script lang="ts">
    import { slide } from 'svelte/transition';
    import ColumnEntry from './ColumnEntry.svelte';
    import DataTypeIcon  from './data-types/DataTypeIcon.svelte';
    import BarAndLabel from './viz//BarAndLabel.svelte';
    import TopKSummary from './viz/TopKSummary.svelte';
    import FormattedDataType from './data-types/FormattedDataType.svelte';
    import { config } from './sizes/sizes';
    import { percentage } from './sizes/sizes';
    import {
        formatInteger,
        formatCompactInteger
    } from '../util/formatters';
    import {
        CATEGORICALS,
        NUMERICS,
        TIMESTAMPS,
        DATA_TYPE_COLORS,
        BOOLEANS
    } from './duckdb-data-types';

    import Histogram from './viz/histogram/SmallHistogram.svelte';
    import TimestampHistogram from './viz/histogram/TimestampHistogram.svelte';
    import NumericHistogram from './viz/histogram/NumericHistogram.svelte';
    // import notificationStore from "../notifications/";

    export let name;
    export let type;
    export let summary;
    export let totalRows;
    export let nullCount;
    export let example;
    export let view = 'summaries'; // summaries, example
    export let containerWidth: number;

    export let indentLevel = 1;

    export let hideRight = false;
    // hide the null percentage number
    export let hideNullPercentage = false;
    export let compactBreakpoint = 350;

    let active = false;

    export function close() {
        active = false;
    }
    $: exampleWidth =
        containerWidth > config.mediumCutoff
            ? config.exampleWidth.medium
            : config.exampleWidth.small;
    $: summaryWidthSize =
        config.summaryVizWidth[
            containerWidth < compactBreakpoint ? 'small' : 'medium'
        ];
    $: cardinalityFormatter =
        containerWidth > config.compactBreakpoint
            ? formatInteger
            : formatCompactInteger;

    let titleTooltip;
</script>

<!-- pl-10 -->
<ColumnEntry
    left={indentLevel === 1 ? 10 : 4}
    {hideRight}
    {active}
    emphasize={active}
    on:select={async event => {
        // we should only allow activation when there are rows present.
        if (totalRows) {
            active = !active;
        }
    }}
>
    <svelte:fragment slot="icon">
        <DataTypeIcon {type} />
    </svelte:fragment>

    <svelte:fragment slot="left" />

    <svelte:fragment slot="right">
        <div
            class="flex gap-2 items-center"
            class:hidden={view !== 'summaries'}
        >
            <div class="flex items-center" style:width="{summaryWidthSize}px">
                <!-- check to see if the summary has cardinality. Otherwise do not show these values.-->
                {#if totalRows}
                    {#if (CATEGORICALS.has(type) || BOOLEANS.has(type)) && summary?.cardinality}
                        <BarAndLabel
                            color={DATA_TYPE_COLORS['VARCHAR'].bgClass}
                            value={summary?.cardinality / totalRows}
                        >
                            |{cardinalityFormatter(summary?.cardinality)}|
                        </BarAndLabel>
                    {:else if NUMERICS.has(type) && summary?.histogram?.length}
                        <Histogram
                            data={summary.histogram}
                            width={summaryWidthSize}
                            height={18}
                            fillColor={DATA_TYPE_COLORS['DOUBLE'].vizFillClass}
                            baselineStrokeColor={DATA_TYPE_COLORS['DOUBLE']
                                .vizStrokeClass}
                        />
                    {:else if TIMESTAMPS.has(type) && summary?.histogram?.length}
                        <Histogram
                            data={summary.histogram}
                            width={summaryWidthSize}
                            height={18}
                            fillColor={DATA_TYPE_COLORS['TIMESTAMP']
                                .vizFillClass}
                            baselineStrokeColor={DATA_TYPE_COLORS['TIMESTAMP']
                                .vizStrokeClass}
                        />
                    {/if}
                {/if}
            </div>

            <div
                style:width="{config.nullPercentageWidth}px"
                class:hidden={hideNullPercentage}
            >
                {#if totalRows !== 0 && totalRows !== undefined && nullCount !== undefined}
                    <BarAndLabel
                        showBackground={nullCount !== 0}
                        color={DATA_TYPE_COLORS[type].bgClass}
                        value={nullCount / totalRows || 0}
                    >
                        <span class:text-gray-300={nullCount === 0}
                            >∅ {percentage(nullCount / totalRows)}</span
                        >
                    </BarAndLabel>
                {/if}
            </div>
        </div>
        <div
            class:hidden={view !== 'example'}
            class="
            pl-8 text-ellipsis overflow-hidden whitespace-nowrap text-right"
            style:max-width="{exampleWidth}px"
        >
            <FormattedDataType
                {type}
                isNull={example === null || example === ''}
                value={example}
            />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="context-button">
        <slot name="context-button" />
    </svelte:fragment>

    <svelte:fragment slot="details">
        {#if active}
            <div
                transition:slide|local={{ duration: 200 }}
                class="pt-3 pb-3  w-full"
            >
                {#if (CATEGORICALS.has(type) || BOOLEANS.has(type)) && summary?.topK}
                    <div class="pl-{indentLevel === 1 ? 16 : 10} pr-4 w-full">
                        <!-- pl-16 pl-8 -->
                        <TopKSummary
                            {containerWidth}
                            color={DATA_TYPE_COLORS['VARCHAR'].bgClass}
                            {totalRows}
                            topK={summary.topK}
                        />
                    </div>
                {:else if NUMERICS.has(type) && summary?.statistics && summary?.histogram?.length}
                    <div class="pl-{indentLevel === 1 ? 12 : 4}">
                        <!-- pl-12 pl-5 -->
                        <!-- FIXME: we have to remove a bit of pad from the right side to make this work -->
                        <NumericHistogram
                            width={containerWidth -
                                (indentLevel === 1 ? 20 + 24 + 44 : 32)}
                            height={65}
                            data={summary.histogram}
                            min={summary.statistics.min}
                            qlow={summary.statistics.q25}
                            median={summary.statistics.q50}
                            qhigh={summary.statistics.q75}
                            mean={summary.statistics.mean}
                            max={summary.statistics.max}
                        />
                    </div>
                {:else if TIMESTAMPS.has(type) && summary?.histogram?.length}
                    <div class="pl-{indentLevel === 1 ? 16 : 10}">
                        <!-- pl-14 pl-10 -->
                        <TimestampHistogram
                            {type}
                            width={containerWidth -
                                (indentLevel === 1 ? 20 + 24 + 54 : 32 + 20)}
                            data={summary.histogram}
                            interval={summary.interval}
                            estimatedSmallestTimeGrain={summary?.estimatedSmallestTimeGrain}
                        />
                    </div>
                {/if}
            </div>
        {/if}
    </svelte:fragment>
</ColumnEntry>
