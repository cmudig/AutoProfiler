<script lang="ts">
    import ExportFactButton from '../export-code/ExportFactButton.svelte';
    import type { ITemporalMeta } from '../../common/exchangeInterfaces';
    import DisplayFact from './DisplayFact.svelte';
    import { formatSort } from '../utils/formatters';

    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let facts: ITemporalMeta;
</script>

<ul class="pt-1 text-gray-600">
    <DisplayFact>
        <svelte:fragment slot="fact">
            This column is {formatSort(facts?.sortedness)}.
        </svelte:fragment>
    </DisplayFact>

    <DisplayFact>
        <svelte:fragment slot="fact">
            Count has {facts?.num_outliers} using the hampel method.
        </svelte:fragment>
        <svelte:fragment slot="end">
            <ExportFactButton
                type="outlier_hampel"
                {dfName}
                {colName}
                {isIndex}
                tooltipText={'Export hampel outliers to code.'}
            />
        </svelte:fragment>
    </DisplayFact>
</ul>
