<script lang="ts">
    /**
     * TimestampBound.svelte
     * ---------------------
     * This component will render the label bound on the TimestampDetail.svelte graph.
     * It also enables a shift + click to copy the bound as a query-ready timestamp.
     */

    import {
        datePortion,
        timePortion,
        removeTimezoneOffset
    } from '../../utils/formatters';

    export let value: Date;
    export let align: 'left' | 'right' = 'left';
    let valueWithoutOffset = undefined;
    $: if (value instanceof Date)
        valueWithoutOffset = removeTimezoneOffset(value);
</script>

<button class="text-{align} text-gray-500" style:line-height={1.1}>
    <div>
        {datePortion(valueWithoutOffset)}
    </div>
    <div>
        {timePortion(valueWithoutOffset)}
    </div>
</button>
