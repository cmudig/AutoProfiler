<script type="ts">
    import { LayerCake, Svg } from 'layercake';
    import { scaleBand } from 'd3-scale';
    import Line from './Line.svelte';
    import Area from './Area.svelte';
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';

    export let data;
    export let xLabel: string;
    export let yLabel: string;
</script>

<div class="layercake-chart fill-red-300 ">
    <LayerCake
        padding={{ left: 75, bottom: 35 }}
        x={'period'}
        y={'value'}
        xScale={scaleBand().paddingInner([0.05])}
        xDomain={data.map(d => d.period)}
        {data}
    >
        <Svg>
            <Line stroke={'#f16161'} />
            <Area fill={'#f7d5d5'} />
            <AxisX {xLabel} />
            <AxisY {yLabel} gridlines={false} />
        </Svg>
    </LayerCake>
</div>

<style>
    .layercake-chart {
        width: 100%;
        height: 200px;
    }
</style>
