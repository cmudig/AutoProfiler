<script lang="ts">
    import type { NgramCount } from '../../../common/exchangeInterfaces';
    import TopKSummary from '../TopKSummary.svelte';

    export let ngram: NgramCount;
    export let selectedNgramNumber: number;
    export let color: string;

    let totalRows = 0;
    let topK = [];
    let prefix = 'uni';

    $: if (selectedNgramNumber === 1) {
        totalRows = ngram.unitotal;
        topK = ngram.unigram;
        prefix = 'uni';
    } else if (selectedNgramNumber === 2) {
        totalRows = ngram.bitotal;
        topK = ngram.bigram;
        prefix = 'bi';
    } else if (selectedNgramNumber === 3) {
        totalRows = ngram.tritotal;
        topK = ngram.trigram;
        prefix = 'tri';
    }
</script>

{#if !totalRows}
    {`No ${prefix}grams available`}
{:else}
    <TopKSummary {color} {totalRows} {topK} />
{/if}
