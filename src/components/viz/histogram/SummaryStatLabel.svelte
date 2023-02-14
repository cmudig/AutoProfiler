<script lang="ts">
    import { fly } from 'svelte/transition';
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../../dataAPI/ProfileModel';
    import { exportCodeSelection } from '../../export-code/ExportableCode';
    import { formatNumeric } from '../../utils/formatters';
    import ExportIcon from '../../icons/ExportIcon.svelte';

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    // Props
    export let defaultColor: string;
    export let highlightColor: string;
    $: circleColor = defaultColor;
    let labelColor = '#000000';

    export let dfName: string;
    export let colName: string;
    export let label;
    export let value;
    export let left: number;
    export let labelOffset: number;
    export let yi: number;
    export let type: string;
    export let x;
    export let histogramID: string;
    export let anchorPlacement: number;
    export let anchor;
    export let fontSize;
    export let isIndex: boolean;

    const vizOffset = 5;
    const buttonSize = 10;
    const buttonOffsetY = 9;
    const buttonOffsetX = 11;

    function formatDisplay(dtype: string, label, value) {
        try {
            // force float display for mean with decimals
            if (label === 'mean' && value - Math.trunc(value) > 0) {
                return formatNumeric('float', value);
            }

            return formatNumeric(dtype, value);
        } catch (e) {
            return value;
        }
    }

    function handleHover() {
        circleColor = highlightColor;
        labelColor = 'hsl(217,1%,40%)';
    }

    function handleUnhover() {
        circleColor = defaultColor;
        labelColor = '#000000';
    }

    // Export code
    function handleClick(event: MouseEvent, label) {
        let code = exportCodeSelection(dfName, colName, label, isIndex);
        profileModel.addCell('code', code);
    }
</script>

<g>
    <g
        class="cp"
        on:click={e => handleClick(e, label)}
        on:mouseenter={handleHover}
        on:mouseleave={handleUnhover}
    >
        <text
            text-anchor="end"
            x={left - labelOffset - vizOffset}
            y={yi}
            fill={labelColor}
        >
            {label}
        </text>

        <ExportIcon
            size={buttonSize}
            x={left - vizOffset - buttonOffsetX}
            y={yi - buttonOffsetY}
        />
    </g>

    <text
        filter="url(#outline-{histogramID})"
        x={x(value) + anchorPlacement}
        y={yi}
        font-size="11"
        fill="hsl(217,1%,40%)"
        text-anchor={anchor}>{formatDisplay(type, label, value)}</text
    >
    <circle
        in:fly={{ duration: 500, y: -5 }}
        class={circleColor}
        cx={x(value)}
        cy={yi - fontSize / 4}
        r="3"
    />
</g>

<style>
    .cp {
        cursor: pointer;
    }
</style>
