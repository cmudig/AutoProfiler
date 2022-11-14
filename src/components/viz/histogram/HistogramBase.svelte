<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicOut as easing } from 'svelte/easing';
    import { scaleLinear } from 'd3-scale';
    import { bisector } from 'd3-array';
    import _ from 'lodash';
    import type { IHistogram } from '../../../common/exchangeInterfaces';
    import HistogramTooltip from './histogram-tooltip/HistogramTooltip.svelte';

    export let data: IHistogram;
    export let width = 60;
    export let height = 19;
    export let time = 1000;
    export let fillColor: string; //'hsl(340, 70%, 70%)';
    export let hoverColor: string = fillColor;
    export let baselineStrokeColor: string;
    export let separate = true;
    $: separateQuantity = separate ? 0.25 : 0;
    export let showTooltip = false;

    // rowsize for table
    export let left = 60;
    export let right = 56;
    export let top = 0;
    export let bottom = 22;
    export let buffer = 4;

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

    $: $lowValue = data[0].low;
    $: $highValue = data.slice(-1)[0].high;

    var bisect = bisector(d => d.high).left;

    let tooltipIdx: number = undefined;
    $: tooltipValue = data[tooltipIdx];

    function handleMousemove(event: MouseEvent) {
        let nearestIdx = bisect(data, X.invert(event.offsetX));
        let np = data[nearestIdx];
        // only show tooltip when mouse x and y are in plot area
        if (
            np &&
            event.offsetX > xScaleMin &&
            event.offsetX < xScaleMax &&
            event.offsetY < Y(0)
        ) {
            tooltipIdx = nearestIdx;
        } else {
            tooltipIdx = undefined;
        }
    }

    function clearMouseMove() {
        tooltipIdx = undefined;
    }

    // utils for position
    // const getX = (plow: number) => X(plow) + separateQuantity;
    // const getWidth = (phigh: number, plow: number) =>
    //     X(phigh) - X(plow) + 2 * separateQuantity;
</script>

<svg
    {width}
    {height}
    on:mousemove={handleMousemove}
    on:mouseleave={clearMouseMove}
>
    <!-- histogram -->
    <g shape-rendering="crispEdges">
        {#if showTooltip && !_.isUndefined(tooltipValue)}
            <rect
                x={X(tooltipValue.low) + separateQuantity}
                width={X(tooltipValue.high) -
                    X(tooltipValue.low) -
                    separateQuantity * 2}
                y={Y(maxY)}
                height={height - 2 * buffer - bottom - top}
                class={'fill-gray-100'}
            />
        {/if}
        {#each data as { low, high, count, bucket }, i}
            {@const x = X(low) + separateQuantity}
            {@const width = X(high) - X(low) - separateQuantity * 2}
            {@const y = Y(0) * (1 - $tw) + Y(count) * $tw}
            {@const height = Math.min(Y(0), Y(0) * $tw - Y(count) * $tw)}

            <rect
                {x}
                {width}
                {y}
                {height}
                class={tooltipIdx === bucket ? hoverColor : fillColor}
            />
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
            textX={left + vizOffset}
            textY={10}
            value={tooltipValue}
            leftBinInclusive={tooltipIdx === 0}
        />
    {/if}
    <slot x={X} y={Y} {buffer} />
</svg>
