<script lang="ts">
    import ExportChartButton from '../export-code/ExportChartButton.svelte';
    import TopKSummary from '../viz/TopKSummary.svelte';
    import StringStats from './StringStats.svelte';
    import NumericalStats from './NumericalStats.svelte';
    import TempFacts from './TempStats.svelte';
    import NumericHistogram from '../viz/histogram/NumericHistogram.svelte';
    import TimestampDetail from '../viz/timestamp/TimestampDetail.svelte';
    import type { AnySummary } from '../../common/exchangeInterfaces';
    import {
        isNumericSummary,
        isCategoricalSummary,
        isTemporalSummary,
        isBooleanSummary
    } from '../../common/exchangeInterfaces';
    import { convertToTimeBin } from '../utils/convertTypes';
    import { DATA_TYPE_COLORS } from '../data-types/pandas-data-types';
    import CollapsibleCard from '../nav/CollapsibleCard.svelte';
    import ExpanderButton from '../nav/ExpanderButton.svelte';

    export let dfName: string;
    export let colName: string;
    export let totalRows: number;
    export let type: string;
    export let summary: AnySummary;
    export let isIndex = false;
    export let wrapperDivWidth: number;
    export let nullCount: number;

    let expanded = false;

    type ValidChartType = 'quant' | 'cat' | 'temporal';

    function determineValidChartType(s: AnySummary): ValidChartType {
        if (isNumericSummary(s) && s?.histogram?.length > 0) {
            return 'quant';
        } else if (
            (isCategoricalSummary(s) || isBooleanSummary(s)) &&
            s?.topK?.length > 0
        ) {
            return 'cat';
        } else if (isTemporalSummary(s) && s?.histogram?.length > 0) {
            return 'temporal';
        }

        return undefined;
    }

    function getNumBins(s: AnySummary): number {
        if (isNumericSummary(s) || isTemporalSummary(s)) {
            return s.histogram.length;
        }
        return 8; // default value, doesnt matter
    }

    $: validatedChartType = determineValidChartType(summary);
</script>

<div>
    {#if isNumericSummary(summary) && validatedChartType === 'quant'}
        <div class="pl-2 pr-2">
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
        </div>
    {:else if (isCategoricalSummary(summary) || isBooleanSummary(summary)) && validatedChartType === 'cat'}
        <div class="pr-2">
            <TopKSummary
                {dfName}
                {colName}
                color={DATA_TYPE_COLORS[type].bgClass}
                {totalRows}
                topK={summary.topK}
                cardinality={summary.cardinality}
            />
        </div>
    {:else if isTemporalSummary(summary) && validatedChartType === 'temporal'}
        <div class="pl-2 pr-2">
            <TimestampDetail
                data={convertToTimeBin(summary?.histogram)}
                xAccessor="ts_end"
                yAccessor="count"
                height={160}
                width={wrapperDivWidth}
                interval={summary?.timeInterval}
            />
        </div>
    {/if}

    <div class="pt-2 pl-2 pr-2">
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
                            shouldDisableMaxRows: totalRows > 5000,
                            numBins: getNumBins(summary)
                        }}
                        {isIndex}
                    />
                {/if}
            </div>

            <div slot="body" class="pl-5">
                {#if isNumericSummary(summary) && validatedChartType === 'quant'}
                    <NumericalStats
                        {dfName}
                        {colName}
                        {isIndex}
                        stats={summary.quantMeta}
                    />
                {:else if isCategoricalSummary(summary) && validatedChartType === 'cat'}
                    <StringStats
                        {dfName}
                        {colName}
                        {isIndex}
                        stats={summary.stringMeta}
                        unique={summary.cardinality}
                        rows={totalRows - nullCount}
                    />
                {:else if isTemporalSummary(summary) && validatedChartType === 'temporal'}
                    <TempFacts 
                        {dfName}
                        {colName}
                        {isIndex}
                        facts={summary.temporalMeta} />
                {:else}
                    <p class="text-gray-600">No summary available.</p>
                {/if}
            </div>
        </CollapsibleCard>
    </div>
</div>
