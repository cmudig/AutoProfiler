<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicOut as easing } from 'svelte/easing';
    import { scaleLinear } from 'd3-scale';
    import { format } from 'd3-format';
    import { bisector } from 'd3-array';
    import { guidGenerator } from '../../utils/guid';
    import type {
        IHistogram,
        IHistogramBin
    } from '../../../common/exchangeInterfaces';
    import HistogramTooltip from './histogram-tooltip/HistogramTooltip.svelte';

    export let data: IHistogram;
    export let width = 60;
    export let height = 19;
    export let time = 1000;
    export let fillColor: string; //'hsl(340, 70%, 70%)';
    export let baselineStrokeColor: string;
    export let dataType = 'int';
    export let separate = true;
    $: separateQuantity = separate ? 0.25 : 0;

    export let showTooltip = false;

    // rowsize for table
    export let left = 60;
    export let right = 56;
    export let top = 0;
    export let bottom = 22;
    export let buffer = 4;
    let tooltipBuffer = 4;

    // dots and labels
    export let vizOffset = 0;

    const tw = tweened(0, { duration: time, easing });

    const lowValue = tweened(0, { duration: time / 2, easing });
    const highValue = tweened(0, { duration: time / 2, easing });

    $: minX = Math.min(...data.map(d => d.low));
    $: maxX = Math.max(...data.map(d => d.high));
    $: xScaleMin = left + vizOffset;
    $: xScaleMax = width - right - vizOffset;
    $: X = scaleLinear().domain([minX, maxX]).range([xScaleMin, xScaleMax]);

    $: yVals = data.map(d => d.count);
    $: maxY = Math.max(...yVals);
    $: Y = scaleLinear()
        .domain([0, maxY])
        .range([height - buffer - bottom, top + buffer]);

    $: tw.set(1);

    $: tweeningFunction =
        dataType === 'int' ? (v: number) => ~~v : (v: number) => v;

    let formatter: Function;
    $: formatter = dataType === 'int' ? format('') : format('.2d');
    $: $lowValue = data[0].low;
    $: $highValue = data.slice(-1)[0].high;

    function transformValue(value, valueType) {
        if (valueType === 'mean') {
            return Math.round(value * 10000) / 10000;
        }
        return value;
    }

    let histogramID = guidGenerator();

    var bisect = bisector(d => d.high).left;

    let tooltipX = 0;
    let tooltipY = 0;
    let tooltipValue: IHistogramBin = undefined;

    function handleMousemove(event: MouseEvent) {
        let nearestIdx = bisect(data, X.invert(event.offsetX));
        let np = data[nearestIdx];
        if (np && event.offsetX > xScaleMin && event.offsetX < xScaleMax) {
            // place in middle
            // tooltipX =
            //     X(np.low) +
            //     separateQuantity +
            //     (X(np.high) - X(np.low) - separateQuantity * 2) / 2;

            tooltipX = event.offsetX;
            tooltipY = Y(0) * (1 - $tw) + Y(np.count) * $tw;
            tooltipValue = np;
        } else {
            tooltipValue = undefined;
        }
    }

    function clearMouseMove() {
        tooltipValue = undefined;
    }
</script>

<svg
    {width}
    {height}
    on:mousemove={handleMousemove}
    on:mouseleave={clearMouseMove}
>
    <!-- histogram -->
    <g shape-rendering="crispEdges">
        {#each data as { low, high, count }, i}
            {@const x = X(low) + separateQuantity}
            {@const width = X(high) - X(low) - separateQuantity * 2}
            {@const y = Y(0) * (1 - $tw) + Y(count) * $tw}
            {@const height = Math.min(Y(0), Y(0) * $tw - Y(count) * $tw)}

            <rect {x} {width} {y} {height} class={fillColor} />
        {/each}
        <line
            x1={left + vizOffset}
            x2={width * $tw - right - vizOffset}
            y1={Y(0) + buffer}
            y2={Y(0) + buffer}
            class={baselineStrokeColor}
        />
    </g>
    {#if showTooltip}
        <HistogramTooltip
            {dataType}
            textX={left + vizOffset}
            textY={10}
            lineX={tooltipX}
            lineY1={top + buffer}
            lineY2={height - buffer - bottom}
            circleY={tooltipY}
            value={tooltipValue}
        />
    {/if}
    <slot x={X} y={Y} {buffer} />
</svg>
