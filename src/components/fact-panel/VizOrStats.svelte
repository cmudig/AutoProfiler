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
    import CollapsibleCard from '../nav/CollapsibleCard.svelte';
    import ExpanderButton from '../nav/ExpanderButton.svelte';

    export let dfName: string;
    export let colName: string;
    export let totalRows: number;
    export let type: string;
    export let summary: ColumnSummary;
    export let isIndex = false;
    export let wrapperDivWidth: number;
    export let nullCount: number;

    let expanded = false;

    type ValidChartType = 'quant' | 'cat' | 'temporal';

    function determineValidChartType(
        t: string,
        s: ColumnSummary
    ): ValidChartType {
        if (NUMERICS.has(t) && s?.quantMeta && s?.histogram?.length) {
            return 'quant';
        } else if ((CATEGORICALS.has(t) || BOOLEANS.has(t)) && s?.topK) {
            return 'cat';
        } else if (TIMESTAMPS.has(type) && summary?.histogram?.length) {
            return 'temporal';
        }

        return undefined;
    }

    $: validatedChartType = determineValidChartType(type, summary);
</script>

<div>
    <div>
        {#if validatedChartType === 'quant'}
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
        {:else if validatedChartType === 'cat'}
            <TopKSummary
                color={DATA_TYPE_COLORS[type].bgClass}
                {totalRows}
                topK={summary.topK}
            />
        {:else if validatedChartType === 'temporal'}
            <TimestampDetail
                data={convertToTimeBin(summary?.histogram)}
                xAccessor="ts_end"
                yAccessor="count"
                height={160}
                width={wrapperDivWidth}
                interval={summary?.timeInterval}
            />
        {/if}
    </div>

    <div class="pt-2">
        <CollapsibleCard bind:open={expanded}>
            <div slot="header" class="flex gap-1 items-center">
                <ExpanderButton rotated={expanded} />
                <p>
                    {#if expanded}Hide {:else}Show{/if} summary
                </p>
            </div>

            <div slot="header-no-collapse">
                {#if validatedChartType}
                    <ExportChartButton
                        chartType={validatedChartType}
                        {dfName}
                        {colName}
                        exportOptions={{
                            shouldDisableMaxRows: totalRows > 5000
                        }}
                        {isIndex}
                    />
                {/if}
            </div>

            <div slot="body" class="pl-5">
                {#if validatedChartType === 'quant'}
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
                {:else if validatedChartType === 'temporal'}
                    <TempFacts facts={summary.temporalMeta} />
                {:else}
                    <p class="text-gray-600">No summary available.</p>
                {/if}
            </div>
        </CollapsibleCard>
    </div>
</div>
