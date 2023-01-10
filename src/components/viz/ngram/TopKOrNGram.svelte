<script lang="ts">
    import type {
        NgramCount,
        ValueCount
    } from '../../../common/exchangeInterfaces';
    import TopKSummary from '../TopKSummary.svelte';
    import ExportChartButton from '../../export-code/ExportChartButton.svelte';
    import NGramVis from './NGramVis.svelte';

    export let dfName: string;
    export let colName: string;
    export let color: string;
    export let topKData: ValueCount[];
    export let totalRows: number;
    export let topKToggleOption: string;
    export let selectedNgramNumber: number;
    export let ngramSummaryCall: () => Promise<NgramCount>;

    // call this here instead of in initial data grab so lazy calls the function
    $: ngramData = ngramSummaryCall();
</script>

<div>
    <div class="flex gap-1 items-center pb-1">
        <div class="grow">
            {#if topKToggleOption === 'ngram'}
                <select
                    class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                    bind:value={selectedNgramNumber}
                >
                    <option value={1}>Unigrams</option>
                    <option value={2}>Bigrams</option>
                    <option value={3}>Trigrams</option>
                </select>
            {/if}
        </div>

        <div class="justify-end">
            <select
                class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                bind:value={topKToggleOption}
            >
                <option value={'topk'}>TopK</option>
                <option value={'ngram'}>N-Grams</option>
            </select>
        </div>
    </div>
    {#if topKToggleOption === 'topk'}
        <div>
            <TopKSummary {color} {totalRows} topK={topKData} />
            <ExportChartButton chartType={'cat'} {dfName} {colName} />
        </div>
    {:else}
        <div>
            {#await ngramData}
                <p>Loading N-Grams...</p>
            {:then ngram}
                <NGramVis {ngram} {selectedNgramNumber} {color} />
            {:catch error}
                <p>Unable to generate ngrams at the moment.</p>
            {/await}
        </div>
    {/if}
</div>
