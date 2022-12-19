<script lang="ts">
    import { slide } from 'svelte/transition';
    import ColumnEntry from './ColumnEntry.svelte';
    import DataTypeIcon from './data-types/DataTypeIcon.svelte';
    import BarAndLabel from './viz//BarAndLabel.svelte';
    import TopKSummary from './viz/TopKSummary.svelte';
    import FormattedDataType from './data-types/FormattedDataType.svelte';
    import { config, percentage, getSummarySize } from './utils/sizes';
    import { formatInteger, formatCompactInteger } from './utils/formatters';
    import {
        CATEGORICALS,
        NUMERICS,
        TIMESTAMPS,
        DATA_TYPE_COLORS,
        BOOLEANS
    } from './data-types/pandas-data-types';
    import Tooltip from './tooltip/Tooltip.svelte';
    import TooltipContent from './tooltip/TooltipContent.svelte';
    import Histogram from './viz/histogram/SmallHistogram.svelte';
    import NumericHistogram from './viz/histogram/NumericHistogram.svelte';
    import TimestampDetail from './viz/timestamp/TimestampDetail.svelte';
    import ExportChartButton from './export-code/ExportChartButton.svelte';
    import type { ColumnSummary } from '../common/exchangeInterfaces';
    import StringStats from './viz/categorical/StringStats.svelte';

    // props
    export let dfName: string;
    export let colName: string;
    export let type: string;
    export let summary: ColumnSummary;
    export let totalRows: number;
    export let nullCount: number;
    export let example: any; // TODO cast harder
    export let view: string = 'summaries'; // summaries, example
    export let containerWidth: number;
    export let hideRight = false;

    // locals
    let active = false;
    let wrapperDivWidth: number;

    $: exampleWidth =
        containerWidth > config.mediumCutoff
            ? config.exampleWidth.medium
            : config.exampleWidth.small;

    $: summaryWidthSize = getSummarySize(containerWidth);

    $: cardinalityFormatter =
        containerWidth > config.compactBreakpoint
            ? formatInteger
            : formatCompactInteger;
</script>

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
        <div style:width="100%">
            <div
                class="column-profile-name text-ellipsis overflow-hidden whitespace-nowrap"
            >
                {colName}
            </div>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="right">
        <div
            class="flex gap-2 items-center"
            class:hidden={view !== 'summaries'}
        >
            <div class="flex items-center" style:width="{summaryWidthSize}px">
                <!-- Distribution preview -->
                <!-- check to see if the summary has cardinality. Otherwise do not show these values.-->
                {#if totalRows}
                    {#if (CATEGORICALS.has(type) || BOOLEANS.has(type)) && summary?.cardinality}
                        <BarAndLabel
                            color={DATA_TYPE_COLORS[type].bgClass}
                            value={summary?.cardinality / totalRows}
                        >
                            |{cardinalityFormatter(summary?.cardinality)}|
                        </BarAndLabel>
                    {:else if NUMERICS.has(type) && summary?.histogram?.length}
                        <Histogram
                            data={summary.histogram}
                            width={summaryWidthSize}
                            height={18}
                            fillColor={DATA_TYPE_COLORS[type].vizFillClass}
                            baselineStrokeColor={DATA_TYPE_COLORS[type]
                                .vizStrokeClass}
                        />
                    {:else if TIMESTAMPS.has(type) && summary?.histogram?.length}
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
                    <Tooltip location="right" alignment="center" distance={8}>
                        <BarAndLabel
                            showBackground={nullCount !== 0}
                            color={'numNullsColor'}
                            value={nullCount / totalRows || 0}
                        >
                            <span class:text-gray-300={nullCount === 0}
                                >∅ {percentage(nullCount / totalRows)}</span
                            >
                        </BarAndLabel>
                        <TooltipContent slot="tooltip-content">
                            <svelte:fragment slot="title">
                                what percentage of values are null?
                            </svelte:fragment>
                            {#if nullCount > 0}
                                {percentage(nullCount / totalRows)} of the values
                                are null
                            {:else}
                                no null values in this column
                            {/if}
                        </TooltipContent>
                    </Tooltip>
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

    <svelte:fragment slot="details">
        {#if active}
            <div
                transition:slide|local={{ duration: 200 }}
                class="pt-1 pb-1 pl-8 pr-4 w-full"
            >
                <div bind:clientWidth={wrapperDivWidth}>
                    {#if totalRows !== 0 && nullCount !== totalRows}
                        {#if (CATEGORICALS.has(type) || BOOLEANS.has(type)) && summary?.topK}
                            {#if CATEGORICALS.has(type)}
                                <StringStats stats={summary.stringSummary} />
                            {/if}
                            <TopKSummary
                                color={DATA_TYPE_COLORS[type].bgClass}
                                {totalRows}
                                topK={summary.topK}
                            />
                            <ExportChartButton
                                chartType={'cat'}
                                {dfName}
                                {colName}
                            />
                        {:else if NUMERICS.has(type) && summary?.statistics && summary?.histogram?.length}
                            <NumericHistogram
                                {type}
                                width={wrapperDivWidth}
                                height={65}
                                data={summary.histogram}
                                min={summary.statistics.min}
                                qlow={summary.statistics.q25}
                                median={summary.statistics.q50}
                                qhigh={summary.statistics.q75}
                                mean={summary.statistics.mean}
                                max={summary.statistics.max}
                            />
                            <ExportChartButton
                                chartType={'quant'}
                                {dfName}
                                {colName}
                                exportOptions={{
                                    numBins: summary.histogram.length
                                }}
                            />
                        {:else if TIMESTAMPS.has(type) && summary?.timeSummary}
                            <TimestampDetail
                                data={summary?.timeSummary.rollup.results}
                                xAccessor="ts_end"
                                yAccessor="count"
                                height={160}
                                width={wrapperDivWidth}
                                interval={summary?.timeSummary.interval}
                            />
                            <ExportChartButton
                                chartType={'temporal'}
                                {dfName}
                                {colName}
                                exportOptions={{
                                    shouldDisableMaxRows: totalRows > 5000
                                }}
                            />
                        {/if}
                    {:else}
                        <p>No values to show for this column</p>
                    {/if}
                </div>
            </div>
        {/if}
    </svelte:fragment>
</ColumnEntry>
