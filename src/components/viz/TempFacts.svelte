<script lang="ts">
    import type { ITemporalFact } from '../../common/exchangeInterfaces';

    export let facts: ITemporalFact;
</script>

<div class="pt-1 text-gray-600 italic">
    <li>{facts.sorted}</li>
</div>
