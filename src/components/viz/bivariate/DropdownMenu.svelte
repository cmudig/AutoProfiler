<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { ColumnProfileData } from '../../../common/exchangeInterfaces';
    import {
        NUMERICS,
        TIMESTAMPS,
        CATEGORICALS
    } from '../../data-types/pandas-data-types';
    import _ from 'lodash';

    const dispatch = createEventDispatcher();

    export let title: string;
    export let selected: boolean;
    export let optionColumns: ColumnProfileData[];
    export let clickable: boolean;
    export let filteringColumn: ColumnProfileData;

    function determineGroup(column: ColumnProfileData) {
        if (NUMERICS.has(column.colType)) {
            return 'NUMERICS';
        } else if (TIMESTAMPS.has(column.colType)) {
            return 'TIMESTAMPS';
        } else if (CATEGORICALS.has(column.colType)) {
            return 'CATEGORICALS';
        } else {
            return 'OTHERS';
        }
    };

    function filterByType(columnProfile: ColumnProfileData) {
        if (!_.isNil(columnProfile)) {
            let columns;
            if (NUMERICS.has(columnProfile.colType)) {
                columns = optionColumns.filter(
                    column =>
                        CATEGORICALS.has(column.colType) ||
                        TIMESTAMPS.has(column.colType)
                );
            } else if (CATEGORICALS.has(columnProfile.colType)) {
                columns = optionColumns.filter(column =>
                    NUMERICS.has(column.colType)
                );
            } else if (TIMESTAMPS.has(columnProfile.colType)) {
                columns = optionColumns.filter(column =>
                    NUMERICS.has(column.colType)
                );
            } else {
                columns = [];
            }
            displayColumns = _.groupBy(columns,column => determineGroup(column));
            displayGroups = Object.keys(displayColumns);
        }
    }

    // let inputValue = '';
    let displayGroups: string[];
    let selectedColumn: ColumnProfileData;
    // let showOptionMenu = false;
    let selectedColumnName: string;

    $: displayColumns = _.groupBy(optionColumns,column => determineGroup(column));
    $: displayGroups = Object.keys(displayColumns);

    $: filterByType(filteringColumn);

    function handleSelectedColumn(colName: string) {
        let column = optionColumns.filter(
            colData => colData.colName === colName
        )[0];
        selected = !selected;
        selectedColumn = column;
        dispatch('select', selectedColumn);
    }

    $: handleSelectedColumn(selectedColumnName);

    let w: number, h: number;

    // function handleInput() {
    //     if (inputValue.length == 0) {
    //         displayColumns = optionColumns;
    //     } else {
    //         displayColumns = optionColumns.filter(column =>
    //             column.colName.toLowerCase().match(inputValue.toLowerCase())
    //         );
    //     }
    // }
</script>

<div class="bivariate-menu" bind:clientWidth={w} bind:clientHeight={h}>
    <!-- <span>{title}</span>
    <div
        class="dropdown-menu-container rounded border border-6 bg-gray-100 hover:border-gray-300"
        on:click={() => {
            if (clickable) {
                showOptionMenu = !showOptionMenu;
            }
        }}
    > -->
    <!-- <div class="dropdown-menu-option pl-1" style="float:left;max-width:75%">
            {selectedColumn?.colName ? selectedColumn.colName : ''}
        </div> -->
    <!-- <svg
            class="pt-1 pb-1 pl-1 pr-1"
            width={'20px'}
            height={'20px'}
            viewBox="0 0 1024 1024"
            fill="#bdbdbd"
            xmlns="http://www.w3.org/2000/svg"
            ><path
                d="M525.873548 897.156129l-383.174193-761.723871 763.045161-1.981935-379.870968 763.705806z"
            /></svg
        > -->
    <!-- {#if showOptionMenu} -->
    <!-- <div
                class="dropdown-menu-options rounded border border-6 bg-gray-100 hover:border-gray-300"
            >
                <div>
                    <input
                        type="text"
                        placeholder="Search..."
                        bind:value={inputValue}
                        on:input={handleInput}
                        on:click={event => {
                            event.stopPropagation();
                        }}
                    />
                </div>
                {#each displayColumns as column}
                    <div
                        class="dropdown-menu-option"
                        on:click={() => {
                            selected = !selected;
                            selectedColumn = column;
                            dispatch('select', selectedColumn);
                        }}
                    >
                        {column.colName}
                    </div>
                {/each}
            </div> -->
    <select bind:value={selectedColumnName} style={"max-width:100%"} disabled={!clickable}>
        <option value="none" selected disabled hidden>Select a column</option>
        {#each displayGroups as group}
            <optgroup label={group}>
                {#each displayColumns[group] as column}
                    <option style="max-width:100%" value={column.colName}
                        >{column.colName}</option
                    >
                {/each}
            </optgroup>{/each}
    </select>
    <!-- {/if} -->
    <!-- </div> -->
</div>

<style>
    svg {
        float: right;
    }

    input {
        max-width: 100%;
    }

    .bivariate-menu {
        max-width: 45%;
        position: relative;
        display: flex;
        padding: 0.2em;
    }

    .dropdown-menu-container {
        width: 95%;
        position: relative;
        display: inline-block;
        height: 20px;
        margin-left: 2px;
    }

    .dropdown-menu-options {
        position: absolute;
        display: block;
        z-index: 10;
        bottom: 20px;
        max-width: 100%;
        max-height: 200px;
        overflow: scroll;
    }

    .dropdown-menu-option {
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
