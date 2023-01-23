<script lang="ts">
    import type { IStringMeta } from '../../../common/exchangeInterfaces';
    import { formatFloat } from '../../utils/formatters';

    export let stats: IStringMeta;
</script>

<div class="pt-1 text-gray-600 italic">
    Values are {stats?.minLength}-{stats?.maxLength} characters long, mean of {formatFloat(
        stats?.meanLength
    )}.
</div>
