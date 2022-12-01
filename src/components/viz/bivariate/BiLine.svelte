<script type="ts">
import { LayerCake, Svg } from 'layercake';
import {scaleBand} from 'd3-scale';
import Line from './Line.svelte';
import Area from './Area.svelte';
import AxisX from './AxisX.svelte';
import AxisY from './AxisY.svelte';

export let data;
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
  padding={{ top: 20, bottom: 60, left: 75, right: 0}}
  x = {'period'}
  y = {'value'}
  xScale = {scaleBand().paddingInner([0.05])}
  xDomain={data.map(d => d.period)}
  data = {data}
  >
  <Svg>
      <Line stroke={"#f16161"}/>
      <Area fill={"#f7d5d5"}/>
      <AxisX xLabel={xLabel}/>
      <AxisY yLabel={yLabel} gridlines={false}/>
    </Svg>
  </LayerCake>
  </div>
  