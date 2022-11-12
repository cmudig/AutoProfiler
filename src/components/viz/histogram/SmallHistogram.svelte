<script lang="ts">
    import HistogramBase from './HistogramBase.svelte';
    import type { IHistogram } from '../../../common/exchangeInterfaces';

    export let data: IHistogram;
    export let width = 60;
    export let height = 19;
    export let fillColor = 'hsl(340, 70%, 70%)';
    export let baselineStrokeColor: string;
</script>

<HistogramBase
    {data}
    {width}
    {height}
    top={4}
    bottom={5.5}
    left={0}
    right={0}
    buffer={0}
    {fillColor}
    {baselineStrokeColor}
    separate={false}
/>
