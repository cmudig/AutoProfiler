<script lang="ts">
    import _ from 'lodash';
    import type { IHistogramBin } from '../../../../common/exchangeInterfaces';
    import { formatNumeric } from '../../../utils/formatters';

    export let dataType = 'float';
    export let textX = 0;
    export let textY = 0;
    export let value: IHistogramBin;

    let fontSize = 12;
    // let textGap = 4;
</script>

{#if !_.isUndefined(value)}
    <g>
        <text
            x={textX}
            y={textY}
            font-size={fontSize}
            class="fill-gray-500"
            text-anchor="left"
        >
            {'('}{formatNumeric(dataType, value.low)}, {formatNumeric(
                dataType,
                value.high
            )}{']'}: {value.count} row{#if value.count !== 1}s{/if}
        </text>
    </g>
{/if}
