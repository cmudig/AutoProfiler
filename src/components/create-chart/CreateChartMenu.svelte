<script lang="ts">
    import _ from 'lodash';
    import type {
        IColTypeTuple,
        AggrType
    } from '../../common/exchangeInterfaces';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import Done from '../icons/Done.svelte';
    import Delete from '../icons/Delete.svelte';
    import { createEventDispatcher } from 'svelte';

    export let inEditMode: boolean;
    export let columnOptions: IColTypeTuple[];
    export let aggrType: AggrType = 'mean';
    export let xVariable: IColTypeTuple;
    export let yVariable: IColTypeTuple;

    // don't allow index columns to be used
    $: validColumns = columnOptions.filter(
        column => column.colName != '' && !column.colIsIndex
    );

    const dispatch = createEventDispatcher();

    function dispatchColumnUpdate() {
        if (!_.isNil(xVariable) && !_.isNil(yVariable)) {
            dispatch('columnEdit', {
                xVariable: xVariable,
                yVariable: yVariable
            });
        }
    }
</script>

<div
    class="flex flex-col gap-1 pl-2 pr-2 pt-2 pb-1 rounded bg-gray-50 border border-gray-200"
>
    <div class="flex gap-1 items-center">
        <DropdownMenu
            selectedColumnName={xVariable?.colName}
            columnOptions={validColumns}
            on:select={event => {
                xVariable = event?.detail;
                dispatchColumnUpdate();
            }}
            clickable={true}
            title={'Column one'}
        />

        <DropdownMenu
            selectedColumnName={yVariable?.colName}
            columnOptions={validColumns}
            on:select={event => {
                yVariable = event?.detail;
                dispatchColumnUpdate();
            }}
            clickable={!_.isNil(xVariable)}
            filteringColumn={xVariable}
            title={'Column two'}
        />

        <select
            class="rounded border border-6 bg-gray-100 hover:border-gray-300 disabled:cursor-not-allowed"
            disabled={_.isNil(xVariable) || _.isNil(yVariable)}
            bind:value={aggrType}
            on:change={() => {
                dispatch('aggrEdit', {
                    aggrType: aggrType
                });
            }}
        >
            {#each ['count', 'mean', 'sum', 'min', 'max'] as typ}
                <option value={typ}>{typ}</option>
            {/each}
        </select>
    </div>

    <div class="flex justify-end">
        <!-- done editing -->
        <Tooltip location="left" alignment="center" distance={8}>
            <button
                class="grid place-items-center rounded hover:bg-gray-100 text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
                style="width: 18px; height: 18px;"
                on:click={() => {
                    inEditMode = !inEditMode;
                }}
                disabled={_.isNil(xVariable) || _.isNil(yVariable)}
            >
                <Done size="14px" />
            </button>
            <TooltipContent slot="tooltip-content">Done</TooltipContent>
        </Tooltip>

        <!-- delete -->
        <Tooltip location="left" alignment="center" distance={8}>
            <button
                class="grid place-items-center rounded hover:bg-gray-100 text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
                style="width: 18px; height: 18px;"
                on:click={() => {
                    dispatch('delete');
                }}
            >
                <Delete size="14px" />
            </button>
            <TooltipContent slot="tooltip-content">Delete</TooltipContent>
        </Tooltip>
    </div>
</div>
