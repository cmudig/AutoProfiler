<script lang="ts">
    import ExportFactButton from '../export-code/ExportFactButton.svelte';
    import type { IStringMeta } from '../../common/exchangeInterfaces';
    import { formatFloat } from '../utils/formatters';
    import DisplayFact from './DisplayFact.svelte';

    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let stats: IStringMeta;
    export let unique: number;
    export let rows: number;
</script>

<ul class="pt-1 text-gray-600">
    <DisplayFact>
        <svelte:fragment slot="fact">
            Entries are {stats?.minLength}-{stats?.maxLength} characters long, mean
            of {formatFloat(stats?.meanLength)}.
        </svelte:fragment>
    </DisplayFact>

    <DisplayFact>
        <svelte:fragment slot="fact">
            {formatFloat((unique / rows) * 100.0)}% of the entires are unique ({unique}
            out of {rows} non-null rows).
        </svelte:fragment>
        <svelte:fragment slot="end">
            <ExportFactButton
                type="duplicates"
                {dfName}
                {colName}
                {isIndex}
                tooltipText={'Export duplicate entries to code.'}
            />
        </svelte:fragment>
    </DisplayFact>
</ul>
