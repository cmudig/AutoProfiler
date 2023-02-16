<script lang="ts">
    import type { ITemporalMeta } from '../../common/exchangeInterfaces';
    import DisplayFact from './DisplayFact.svelte';
    import { formatSort } from '../utils/formatters';

    export let facts: ITemporalMeta;
</script>

<ul class="pt-1 text-gray-600">
    <DisplayFact>
        <svelte:fragment slot="fact">
            This column is {formatSort(facts?.sortedness)}.
        </svelte:fragment>
    </DisplayFact>
</ul>
