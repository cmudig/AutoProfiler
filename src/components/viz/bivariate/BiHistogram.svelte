<script lang="ts">
    import _ from 'lodash';

    // import LayerCake component
    import { LayerCake, Svg } from 'layercake';
    import { scaleBand } from 'd3-scale';
    import Bar from './Bar.svelte';
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';

    export let data;

    // rowsize for table

    // dots and labels
    export let xLabel: string;
    export let yLabel: string;
</script>

<div class="layercake-chart fill-red-300 ">
    <LayerCake
        padding={{ left: 75, bottom: 35 }}
        x={'count'}
        y={'value'}
        yScale={scaleBand().paddingInner([0.05])}
        yDomain={data.map(d => d.value)}
        xDomain={[0, null]}
        {data}
    >
        <Svg>
            <Bar fill={'#fca5a5'} />
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
