<script lang="ts">
    import ExportFactButton from '../export-code/ExportFactButton.svelte';
    import type { IQuantMeta } from '../../common/exchangeInterfaces';
    import DisplayFact from './DisplayFact.svelte';
    import { formatSort, formatInteger } from '../utils/formatters';

    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let stats: IQuantMeta;

    function formatNumberString(
        n_zero: number,
        n_positive: number,
        n_negative: number
    ) {
        if (n_zero === 0 && n_positive === 0 && n_negative === 0) {
            return 'No values.';
        } else if (n_zero === 0 && n_positive === 0) {
            return 'All values are negative.';
        } else if (n_zero === 0 && n_negative === 0) {
            return 'All values are positive.';
        } else if (n_positive === 0 && n_negative === 0) {
            return 'All values are zero.';
        } else if (n_zero === 0) {
            return `There are ${formatInteger(
                n_positive
            )} positive values and ${formatInteger(
                n_negative
            )} negative values.`;
        } else if (n_positive === 0) {
            return `There are ${formatInteger(
                n_zero
            )} zero values and ${formatInteger(n_negative)} negative values.`;
        } else if (n_negative === 0) {
            return `There are ${formatInteger(
                n_zero
            )} zero values and ${formatInteger(n_positive)} positive values.`;
        } else {
            return `There are ${formatInteger(
                n_zero
            )} zero values, ${n_positive} positive values, and ${formatInteger(
                n_negative
            )} negative values.`;
        }
    }
</script>

<ul class="pt-1 text-gray-600">
    <DisplayFact>
        <svelte:fragment slot="fact">
            There {stats?.sd_outlier === 1 ? 'is' : 'are'}
            <span class="font-semibold">
                {stats?.sd_outlier} outlier{stats?.sd_outlier === 1 ? '' : 's'}
            </span> greater than 3 std from the mean.
        </svelte:fragment>
        <svelte:fragment slot="end">
            <ExportFactButton
                type="outliers_sd"
                {dfName}
                {colName}
                {isIndex}
                tooltipText={'Export outliers to code.'}
            />
        </svelte:fragment>
    </DisplayFact>

    <DisplayFact>
        <svelte:fragment slot="fact">
            There {stats?.iqr_outlier === 1 ? 'is' : 'are'}
            <span class="font-semibold">
                {stats?.iqr_outlier} outlier{stats?.iqr_outlier === 1
                    ? ''
                    : 's'}
            </span> more than 1.5 * IQR above q1 or below q3.
        </svelte:fragment>
        <svelte:fragment slot="end">
            <ExportFactButton
                type="outliers_iqr"
                {dfName}
                {colName}
                {isIndex}
                tooltipText={'Export outliers to code.'}
            />
        </svelte:fragment>
    </DisplayFact>

    <DisplayFact>
        <svelte:fragment slot="fact">
            This column is {formatSort(stats?.sortedness)}.
        </svelte:fragment>
    </DisplayFact>

    <DisplayFact>
        <svelte:fragment slot="fact">
            {formatNumberString(
                stats?.n_zero,
                stats?.n_positive,
                stats?.n_negative
            )}
        </svelte:fragment>
    </DisplayFact>
</ul>
