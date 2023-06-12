<script lang="ts">
    import { format } from 'd3-format';
    import BarAndLabel from './BarAndLabel.svelte';
    import type { ValueCount } from '../../common/exchangeInterfaces';
    import {
        exportCatValue,
        exportAllUnique
    } from '../export-code/ExportableCode';
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import ExportIcon from '../icons/ExportIcon.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    export let totalRows: number;
    export let topK: ValueCount[];
    export let color: string;
    export let cardinality: number;

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
        // event.altKey alt key or option key on mac

        let code = exportCatValue(dfName, colName, value);
        profileModel.addCell('code', code);
    }

    function handleUniqueExport() {
        let code = exportAllUnique(dfName, colName);
        profileModel.addCell('code', code);
    }

    let currentHoverCol: string = undefined;

    function handleColHover(colName: string) {
        currentHoverCol = colName;
    }
</script>

<div class="w-full pl-2">
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
                class="overflow-hidden hover:text-gray-500 flex items-center gap-1"
                on:click={e => handleClick(e, value)}
                on:mouseover={() => handleColHover(value)}
                on:focus={() => handleColHover(value)}
                on:mouseleave={() => handleColHover(undefined)}
                on:blur={() => handleColHover(undefined)}
            >
                <Tooltip location="bottom" alignment="center" distance={8}>
                    <button
                        class="grid place-items-center rounded hover:bg-gray-100 text-gray-500 {currentHoverCol ===
                        value
                            ? 'visible'
                            : 'invisible'}"
                        style="width: 14px; height: 14px;"
                    >
                        <ExportIcon size="12px" />
                    </button>

                    <TooltipContent slot="tooltip-content"
                        >Export rows to code</TooltipContent
                    >
                </Tooltip>
                <p
                    class="text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                >
                    {printValue}
                </p>
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

        {#if cardinality > 10}
            {@const numExtra = cardinality - 10}
            <div class="pl-4 flex gap-1">
                <p class="italic text-gray-600">
                    + {formatCount(numExtra)} more unique value{numExtra > 1
                        ? 's'
                        : ''}
                </p>
                <Tooltip location="bottom" alignment="center" distance={8}>
                    <button
                        class="grid place-items-center rounded hover:bg-gray-100 text-gray-500"
                        style="width: 20px; height: 20px;"
                        on:click={handleUniqueExport}
                    >
                        <ExportIcon size="12px" />
                    </button>

                    <TooltipContent slot="tooltip-content"
                        >Export unique values to code</TooltipContent
                    >
                </Tooltip>
            </div>
        {/if}
    </div>
</div>
