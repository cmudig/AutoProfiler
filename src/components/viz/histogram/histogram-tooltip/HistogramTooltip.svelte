<script lang="ts">
    import _ from 'lodash';
    import type { IHistogramBin } from '../../../../common/exchangeInterfaces';
    import { formatNumeric } from '../../../utils/formatters';

    export let dataType = 'float';
    export let textX = 0;
    export let textY = 0;
    export let lineX = 0;
    export let lineY1 = 0;
    export let lineY2 = 0;
    export let circleY = 0;
    export let value: IHistogramBin;

    let fontSize = 12;
    let textGap = 4;
</script>

{#if !_.isUndefined(value)}
    <g>
        <line
            x1={lineX}
            x2={lineX}
            y1={lineY1}
            y2={lineY2}
            stroke="rgb(100,100,100)"
        />
        <circle cx={lineX} cy={circleY} r={3} fill={'rgb(100,100,100)'} />

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
            )}{']'}
        </text>
        <text
            x={textX}
            y={textY + fontSize + textGap}
            font-size={fontSize}
            class="fill-gray-500"
            text-anchor="left"
        >
            {value.count} row{#if value.count !== 1}s{/if}
        </text>
    </g>
{/if}
