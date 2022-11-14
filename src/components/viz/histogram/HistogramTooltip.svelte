<script>
    import _ from 'lodash';

    export let x = 0;
    export let y = 0;
    export let value;
</script>

{#if !_.isUndefined(value)}
    <g>
        <text {x} {y} font-size="11" class="fill-gray-500" text-anchor="middle">
            {value}
        </text>
    </g>
{/if}
