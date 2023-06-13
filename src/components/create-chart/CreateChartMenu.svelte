<script lang="ts">
    import type {
        ColumnProfileData,
        IColTypeTuple
    } from '../../common/exchangeInterfaces';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import Done from '../icons/Done.svelte';
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

    function createChart() {
        if (!_.isNil(xVariable) && !_.isNil(yVariable)) {
            console.log(
                'creating chart with x ',
                xVariable,
                ' and y ',
                yVariable
            );
            // avoid generating charts of same x and y variables
            // let duplicated = false;
            // for (let i = 0; i < xVariables.length; i++) {
            //     if (
            //         (xVariable === xVariables[i] &&
            //             yVariable === yVariables[i]) ||
            //         (yVariable === xVariables[i] && xVariable === yVariables[i])
            //     ) {
            //         duplicated = true;
            //     }
            // }

            createChartFunc(xVariable, yVariable);
        }
    }

    $: console.log(
        'Done is disabled: ',
        _.isNil(xVariable) || _.isNil(yVariable)
    );
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
            {columnOptions}
            on:select={event => {
                console.log('setting xVariable: ', event.detail);
                xVariable = event?.detail;
            }}
            clickable={true}
            title={'Select 1st column'}
        />

        <DropdownMenu
            {columnOptions}
            on:select={event => {
                console.log('setting yVariable: ', event.detail);
                yVariable = event?.detail;
            }}
            clickable={!_.isNil(xVariable)}
            filteringColumn={xVariable}
            title={'Select 2nd column'}
        />
        <button
            disabled={_.isNil(xVariable) || _.isNil(yVariable)}
            class="flex rounded border border-6 bg-gray-100 hover:border-gray-300"
            on:click={createChart}
        >
            {'Done '}<Done />
        </button>
    </div>
</div>
