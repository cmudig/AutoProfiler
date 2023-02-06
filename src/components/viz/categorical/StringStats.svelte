<script lang="ts">
    import ExportFactButton from '../../export-code/ExportFactButton.svelte';
    import type { IStringMeta } from '../../../common/exchangeInterfaces';
    import { formatFloat } from '../../utils/formatters';

    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let stats: IStringMeta;
    export let unique: number;
    export let rows: number;
</script>

<div class="pt-1 text-gray-600 italic">
    <li>
        Values are {stats?.minLength}-{stats?.maxLength} characters long, mean of
        {formatFloat(stats?.meanLength)}.
    </li>
    <li>
        {unique} out of {rows} non-null rows are unique entries ({formatFloat(
            (unique / rows) * 100.0
        )}% of the entires are unique).
        <ExportFactButton type="unique" {dfName} {colName} {isIndex} />
    </li>
</div>
