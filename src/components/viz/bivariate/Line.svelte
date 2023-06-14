<script>
    import { getContext } from 'svelte';

    const { data, xGet, yGet, extents } = getContext('LayerCake');

    export let stroke = '#00bbff';

    $: path =
        'M' +
        $data
            .map(d => {
                return $xGet(d) + ',' + $yGet(d);
            })
            .join('L');
</script>

<path class="path-line" d={path} {stroke} />

<style>
    .path-line {
        fill: none;
        stroke-linejoin: round;
        stroke-linecap: round;
        stroke-width: 2;
    }
</style>
