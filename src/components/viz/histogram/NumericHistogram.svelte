<script lang="ts">
    import { guidGenerator } from '../../utils/guid';
    import HistogramBase from './HistogramBase.svelte';
    import { NUMERIC_TOKENS } from '../../data-types/pandas-data-types';
    import SummaryStatLabel from './SummaryStatLabel.svelte';

    export let data;
    export let width = 100;
    export let height = 100;
    export let dfName: string;
    export let colName: string;
    export let isIndex: boolean;

    let left = 70;
    let right = 4;
    let top = 14;

    export let type: string;
    export let min: number;
    export let qlow: number;
    export let median: number;
    export let qhigh: number;
    export let mean: number;
    export let max: number;

    export let anchorBuffer = 8;
    export let labelOffset = 16;

    let histogramID = guidGenerator();

    $: effectiveWidth = Math.max(width - 8, 120);

    let fontSize = 12;
    let buffer = 4;
</script>

<HistogramBase
    showTooltip={true}
    {dfName}
    {colName}
    separate={width > 300}
    bind:buffer
    {top}
    fillColor={NUMERIC_TOKENS.vizFillClass}
    hoverColor={NUMERIC_TOKENS.vizHoverClass}
    baselineStrokeColor={NUMERIC_TOKENS.vizStrokeClass}
    {data}
    {left}
    {right}
    width={effectiveWidth}
    height={height + 6 * (fontSize + buffer + anchorBuffer) + anchorBuffer}
    bottom={6 * (fontSize + buffer + anchorBuffer / 2)}
>
    <svelte:fragment let:x let:y let:buffer>
        <filter id="outline-{histogramID}">
            <feMorphology
                in="SourceAlpha"
                result="DILATED"
                operator="dilate"
                radius="1"
            />
            <feFlood flood-color="white" flood-opacity="1" result="PINK" />
            <feComposite
                in="PINK"
                in2="DILATED"
                operator="in"
                result="OUTLINE"
            />

            <feMerge>
                <feMergeNode in="OUTLINE" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <g class="textElements">
            <!-- horizontal dashed lines -->
            {#each [['min', min], ['25%', qlow], ['median', median], ['mean', mean], ['75%', qhigh], ['max', max]] as [label, value], i}
                {@const yi =
                    y(0) +
                    anchorBuffer +
                    i * (fontSize + buffer + anchorBuffer / 2) +
                    anchorBuffer * 2}

                <line
                    x1={left}
                    x2={width - right}
                    y1={yi - fontSize / 4}
                    y2={yi - fontSize / 4}
                    stroke-dasharray="2,1"
                    class="stroke-gray-300"
                />
                <line
                    x1={x(value)}
                    x2={x(value)}
                    y1={yi - fontSize / 4}
                    y2={y(0) + 4}
                    class="stroke-gray-300"
                />
            {/each}

            <!-- circles with data labels -->
            {#each [['min', min], ['25%', qlow], ['median', median], ['mean', mean], ['75%', qhigh], ['max', max]] as [label, value], i}
                {@const yi =
                    y(0) +
                    anchorBuffer +
                    i * (fontSize + buffer + anchorBuffer / 2) +
                    anchorBuffer * 2}
                {@const anchor = x(value) < width / 2 ? 'start' : 'end'}
                {@const anchorPlacement =
                    anchor === 'start' ? anchorBuffer : -anchorBuffer}

                <SummaryStatLabel
                    {dfName}
                    {colName}
                    {isIndex}
                    defaultColor={NUMERIC_TOKENS.vizFillClass}
                    highlightColor={NUMERIC_TOKENS.vizHoverClass}
                    {label}
                    {value}
                    {left}
                    {labelOffset}
                    {yi}
                    {type}
                    {x}
                    {histogramID}
                    {anchorPlacement}
                    {anchor}
                    {fontSize}
                />
            {/each}
        </g>
    </svelte:fragment>
</HistogramBase>
