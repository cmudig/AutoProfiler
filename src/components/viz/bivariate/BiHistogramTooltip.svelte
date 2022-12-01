<script lang="ts">
    import _ from 'lodash';
    import type { IHistogramBin } from '../../../common/exchangeInterfaces';
    import { formatFloat, formatInteger } from '../../utils/formatters';
    // Pandas histogram bins are always floats so can format accordingly

    export let textX = 0;
    export let textY = 0;
    export let data;

    let fontSize = 12;
</script>

{#if !_.isUndefined(data)}
    <g>
        <text
            x={textX}
            y={textY}
            font-size={fontSize}
            class="fill-gray-500"
            text-anchor="left"
        >
        {data.value}: {data.count.toFixed(2)}
            <!-- {}
            {leftBinInclusive ? '[' : '('}{formatFloat(value.low)}, {formatFloat(
                value.high
            )}{']'}: {formatInteger(value.count)}
            row{#if value.count !== 1}s{/if} -->
        </text>
    </g>
{/if}
