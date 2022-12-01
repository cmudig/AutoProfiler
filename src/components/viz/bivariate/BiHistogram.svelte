<script lang="ts">

    import _ from 'lodash';



    // import LayerCake component
    import { LayerCake, Svg } from 'layercake';
    import {scaleBand} from 'd3-scale';
    import Bar from './Bar.svelte';
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';

    export let data;


    // rowsize for table

    // dots and labels
    export let xLabel: string;
    export let yLabel: string;

</script>

<style>
    .layercake-chart{
        width: 100%;
        height: 217px;
    }
</style>

<div class="layercake-chart fill-red-300 ">
<LayerCake
padding={{ top: 20, bottom: 50, left: 75, right: 0}}
x = {'count'}
y = {'value'}
yScale = {scaleBand().paddingInner([0.05])}
yDomain={data.map(d => d.value)}
xDomain={[0,null]}
data = {data}
>
<Svg>
    <Bar fill={"#fca5a5"}/>
    <AxisX xLabel={xLabel}/>
    <AxisY yLabel={yLabel} gridlines={false}/>
  </Svg>
</LayerCake>
</div>
