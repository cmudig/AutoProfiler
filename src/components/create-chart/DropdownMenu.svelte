<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { IColTypeTuple } from '../../common/exchangeInterfaces';
    import {
        NUMERICS,
        TIMESTAMPS,
        CATEGORICALS
    } from '../data-types/pandas-data-types';
    import _ from 'lodash';

    const dispatch = createEventDispatcher();

    export let columnOptions: IColTypeTuple[];
    export let filteringColumn: IColTypeTuple = undefined;
    export let clickable: boolean = true;
    export let title = 'Select a column';

    function determineGroup(column: IColTypeTuple) {
        if (NUMERICS.has(column.colType)) {
            return 'NUMERICS';
        } else if (TIMESTAMPS.has(column.colType)) {
            return 'TIMESTAMPS';
        } else if (CATEGORICALS.has(column.colType)) {
            return 'CATEGORICALS';
        } else {
            return 'OTHERS';
        }
    }

    function filterByType(columnProfile: IColTypeTuple) {
        if (columnProfile != undefined) {
            let columns;
            if (NUMERICS.has(columnProfile.colType)) {
                columns = columnOptions.filter(
                    column =>
                        CATEGORICALS.has(column.colType) ||
                        TIMESTAMPS.has(column.colType)
                );
            } else if (CATEGORICALS.has(columnProfile.colType)) {
                columns = columnOptions.filter(column =>
                    NUMERICS.has(column.colType)
                );
            } else if (TIMESTAMPS.has(columnProfile.colType)) {
                columns = columnOptions.filter(column =>
                    NUMERICS.has(column.colType)
                );
            } else {
                columns = [];
            }
            displayColumns = _.groupBy(columns, column =>
                determineGroup(column)
            );
            displayGroups = Object.keys(displayColumns);
        }
    }

    let displayGroups: string[];
    let selectedColumn: IColTypeTuple;
    let selectedColumnName: string;

    $: displayColumns = _.groupBy(columnOptions, column =>
        determineGroup(column)
    );
    $: displayGroups = Object.keys(displayColumns);

    $: filterByType(filteringColumn);

    function handleSelectedColumn(colName: string) {
        let column = columnOptions.filter(
            colData => colData.colName === colName
        )[0];
        selectedColumn = column;
        dispatch('select', selectedColumn);
    }

    $: handleSelectedColumn(selectedColumnName);
</script>

<div class="bivariate-menu">
    <select
        class="rounded border border-6 bg-gray-100 hover:border-gray-300"
        bind:value={selectedColumnName}
        disabled={!clickable}
    >
        <option value="none" disabled hidden>{title}</option>
        {#each displayGroups as group}
            <optgroup label={group}>
                {#each displayColumns[group] as column}
                    <option style="max-width:100%" value={column.colName}
                        >{column.colName}</option
                    >
                {/each}
            </optgroup>
        {/each}
    </select>
</div>
