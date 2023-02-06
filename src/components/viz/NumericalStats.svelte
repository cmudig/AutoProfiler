<script lang="ts">
    import ExportFactButton from '../export-code/ExportFactButton.svelte';
    import type { IQuantRow } from '../../common/exchangeInterfaces';

    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let stats: IQuantRow;
</script>

<div class="pt-1 text-gray-600 italic">
    <li>
        Using the Standard Deviation method, there are {stats?.sd_outlier} outliers.
    </li>
    <ExportFactButton type="sd" {dfName} {colName} {isIndex} />
    <li>Using the IQR method, there are {stats?.iqr_outlier} outliers.</li>
    <ExportFactButton type="iqr" {dfName} {colName} {isIndex} />
    <li>The column is {stats?.ascending}.</li>

    <li>
        {#if stats?.positive > 0}
            {#if stats?.zero === 0 && stats?.negative === 0}
                All values are positive.
            {:else if stats?.negative === 0}
                All values are non-negative. There are {stats?.positive} positive
                values and {stats?.zero} zero values
            {:else}
                There are {stats?.positive} positive values, {stats?.zero} zero values,
                and {stats?.negative} negative numbers.
            {/if}
        {:else if stats?.zero > 0}
            {#if stats?.negative === 0}
                All values are equal to zero.
            {:else}
                There are {stats?.negative} negative values and {stats?.zero} zero
                values.
            {/if}
        {:else if stats?.negative > 0}
            All values are negative.
        {:else}
            NaN
        {/if}
    </li>
</div>
