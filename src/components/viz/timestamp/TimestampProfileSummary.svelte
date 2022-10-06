<script lang="ts">
    /** TimestampProfileSummary
     * ------------------------
     * This component provides summary information about the
     * timestamp profile at the top of the detail plot.
     */
    import { intervalToTimestring } from '../../utils/formatters';

    import type { Interval } from '../../../common/exchangeInterfaces';

    export let interval: Interval;
</script>

<div
    class="text-gray-500 italic pb-3"
    style="
        display: grid;
        grid-template-columns: auto;
    "
>
    <div>
        {#if interval}
            Range is {intervalToTimestring(interval)}
        {/if}
    </div>
    <div class="text-gray-400">Ctrl + Click + Drag to zoom</div>
</div>
