<script lang="ts">
    import { format } from 'd3-format';
    import BarAndLabel from './BarAndLabel.svelte';
    import type { ValueCount } from '../../common/exchangeInterfaces';
    import { exportCatValue } from '../export-code/ExportableCode';
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';

    export let totalRows: number;
    export let topK: ValueCount[];
    export let color: string;

    export let dfName = '';
    export let colName = '';

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    $: smallestPercentage = Math.min(
        ...topK.slice(0, 5).map(entry => entry.count / totalRows)
    );
    $: formatPercentage =
        smallestPercentage < 0.01 ? format('0.2%') : format('0.1%');

    $: formatCount = format(',');

    function handleClick(event: MouseEvent, value: string) {
        // alt key or option key on mac
        if (event.altKey) {
            let code = exportCatValue(dfName, colName, value);
            profileModel.addCell('code', code);
        }
    }
</script>

<div class="w-full">
    <div
        class="grid w-full"
        style="
        grid-template-columns: auto  max-content; 
        grid-auto-rows: 19px;
        justify-items: stretch; 
        justify-content: stretch; 
        grid-column-gap: 1rem;"
    >
        {#each topK.slice(0, 10) as { value, count }}
            {@const printValue = value === null ? ' null ∅' : value}
            <div
                class="text-ellipsis overflow-hidden whitespace-nowrap hover:text-gray-500"
                on:click={e => handleClick(e, value)}
            >
                {printValue}
            </div>

            {@const negligiblePercentage = count / totalRows < 0.0002}
            {@const percentage = negligiblePercentage
                ? '<.01%'
                : formatPercentage(count / totalRows)}
            <div>
                <BarAndLabel value={count / totalRows} {color}>
                    <span class:text-gray-500={negligiblePercentage}>
                        {formatCount(count)}

                        {#if percentage.length < 6}&nbsp;{/if}{#if percentage.length < 5}&nbsp;{/if}&nbsp;<span
                            class:text-gray-600={!negligiblePercentage}
                            >({percentage})</span
                        >
                    </span>
                </BarAndLabel>
            </div>
        {/each}
    </div>
</div>
