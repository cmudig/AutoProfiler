<script lang="ts">
    import type {
        ColumnProfileData,
        IColTypeTuple
    } from '../../common/exchangeInterfaces';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import Cancel from '../icons/Cancel.svelte';
    import _ from 'lodash';

    export let showAddChartButton: boolean;
    export let columnOptions: ColumnProfileData[];
    export let createChartFunc: (
        xVariable: IColTypeTuple,
        yVariable: IColTypeTuple
    ) => void;

    let xVariable: IColTypeTuple;
    let yVariable: IColTypeTuple;

    // don't allow index columns to be used
    $: validColumns = columnOptions.filter(
        column => column.colName != '' && !column.colIsIndex
    );

    function createChart() {
        if (!_.isNil(xVariable) && !_.isNil(yVariable)) {
            console.log(
                'creating chart with x ',
                xVariable,
                ' and y ',
                yVariable
            );
            createChartFunc(xVariable, yVariable);
        }
    }
</script>

<div
    class="flex flex-col pl-3 pr-3 pt-2 pb-2 rounded bg-gray-50 border border-gray-100"
>
    <div class="flex w-full pb-2" style="width:100%">
        <span class="grow font-bold">Add new chart</span>
        <div class="pl-2">
            <Tooltip location="right" alignment="center" distance={8}>
                <button
                    class="grid place-items-center rounded hover:bg-gray-100 text-gray-400"
                    style="width: 16px; height: 16px;"
                    on:click={() => {
                        showAddChartButton = !showAddChartButton;
                    }}
                >
                    <Cancel size="16px" />
                </button>
                <TooltipContent slot="tooltip-content">Cancel</TooltipContent>
            </Tooltip>
        </div>
    </div>

    <div class="flex w-full gap-2 items-center">
        <DropdownMenu
            columnOptions={validColumns}
            on:select={event => {
                console.log('setting xVariable: ', event.detail);
                xVariable = event?.detail;
            }}
            clickable={true}
            title={'First column'}
        />

        <DropdownMenu
            columnOptions={validColumns}
            on:select={event => {
                console.log('setting yVariable: ', event.detail);
                yVariable = event?.detail;
            }}
            clickable={!_.isNil(xVariable)}
            filteringColumn={xVariable}
            title={'Second column'}
        />
        <button
            class="flex rounded border border-6 enabled:bg-gray-100 hover:border-gray-300 pl-1 pr-1 disabled:opacity-70 disabled:cursor-not-allowed "
            disabled={_.isNil(xVariable) || _.isNil(yVariable)}
            on:click={createChart}
        >
            Done
        </button>
    </div>
</div>
