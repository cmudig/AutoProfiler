<script lang="ts">
    import ExportChartButton from '../export-code/ExportChartButton.svelte';
    import TopKSummary from '../viz/TopKSummary.svelte';
    import StringStats from './StringStats.svelte';
    import NumericalStats from './NumericalStats.svelte';
    import TempFacts from './TempStats.svelte';
    import NumericHistogram from '../viz/histogram/NumericHistogram.svelte';
    import TimestampDetail from '../viz/timestamp/TimestampDetail.svelte';
    import type { ColumnSummary } from '../../common/exchangeInterfaces';
    import { convertToTimeBin } from '../utils/convertTypes';
    import {
        CATEGORICALS,
        NUMERICS,
        TIMESTAMPS,
        DATA_TYPE_COLORS,
        BOOLEANS
    } from '../data-types/pandas-data-types';

    export let dfName: string;
    export let colName: string;
    export let totalRows: number;
    export let type: string;
    export let vizToggleOption: string;
    export let summary: ColumnSummary;
    export let isIndex = false;
    export let wrapperDivWidth: number;
    export let nullCount: number;
</script>

<div>
    <div class="flex gap-1 items-center pb-1">
        <div class="justify-end">
            <select
                class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                bind:value={vizToggleOption}
            >
                <option value={'viz'}>Chart</option>
                <option value={'text'}>Summary</option>
            </select>
        </div>
    </div>
    {#if vizToggleOption === 'viz'}
        <div>
            {#if NUMERICS.has(type) && summary?.quantMeta && summary?.histogram?.length}
                <NumericHistogram
                    {dfName}
                    {colName}
                    {type}
                    {isIndex}
                    width={wrapperDivWidth}
                    height={65}
                    data={summary.histogram}
                    min={summary.quantMeta.min}
                    qlow={summary.quantMeta.q25}
                    median={summary.quantMeta.q50}
                    qhigh={summary.quantMeta.q75}
                    mean={summary.quantMeta.mean}
                    max={summary.quantMeta.max}
                />
                <div class="mt-1">
                    <ExportChartButton
                        chartType={'quant'}
                        {dfName}
                        {colName}
                        exportOptions={{
                            numBins: summary.histogram.length
                        }}
                        {isIndex}
                    />
                </div>
            {:else if (CATEGORICALS.has(type) || BOOLEANS.has(type)) && summary?.topK}
                <TopKSummary
                    color={DATA_TYPE_COLORS[type].bgClass}
                    {totalRows}
                    topK={summary.topK}
                />
                <div class="mt-1">
                    <ExportChartButton
                        chartType={'cat'}
                        {dfName}
                        {colName}
                        {isIndex}
                    />
                </div>
            {:else if TIMESTAMPS.has(type) && summary?.histogram?.length}
                <TimestampDetail
                    data={convertToTimeBin(summary?.histogram)}
                    xAccessor="ts_end"
                    yAccessor="count"
                    height={160}
                    width={wrapperDivWidth}
                    interval={summary?.timeInterval}
                />
                <div class="mt-1">
                    <ExportChartButton
                        chartType={'temporal'}
                        {dfName}
                        {colName}
                        exportOptions={{
                            shouldDisableMaxRows: totalRows > 5000
                        }}
                        {isIndex}
                    />
                </div>
            {/if}
        </div>
    {:else}
        <div class="pl-6 pr-2">
            {#if NUMERICS.has(type)}
                <NumericalStats
                    {dfName}
                    {colName}
                    {isIndex}
                    stats={summary.quantMeta}
                />
            {:else if CATEGORICALS.has(type)}
                <StringStats
                    {dfName}
                    {colName}
                    {isIndex}
                    stats={summary.stringMeta}
                    unique={summary.cardinality}
                    rows={totalRows - nullCount}
                />
            {:else if TIMESTAMPS.has(type)}
                <TempFacts facts={summary.temporalMeta} />
            {/if}
        </div>
    {/if}
</div>
