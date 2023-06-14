<!--
  @component
  Generates an SVG area shape using the `area` function from [d3-shape](https://github.com/d3/d3-shape).
 -->
<script>
    import { getContext } from 'svelte';

    const { data, xGet, yGet, xScale, yScale, extents } =
        getContext('LayerCake');

    /**  @type {String} [fill='#ab00d610'] The shape's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
    export let fill = '#f7d5d5';

    $: path =
        'M' +
        $data
            .map(d => {
                return $xGet(d) + ',' + $yGet(d);
            })
            .join('L');

    let area;

    $: {
        const yRange = $yScale.range();

        area =
            path +
            ('L' +
                $xGet($data[$data.length - 1]) +
                ',' +
                yRange[0] +
                'L' +
                $xGet($data[0]) +
                ',' +
                yRange[0] +
                'Z');
    }
</script>

<path class="path-area" d={area} {fill} />
