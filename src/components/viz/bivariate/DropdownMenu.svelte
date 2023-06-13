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

    export let selected: boolean;
    export let optionColumns: ColumnProfileData[];
    export let clickable: boolean;
    export let filteringColumn: ColumnProfileData = undefined;

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
    }

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
            displayColumns = _.groupBy(columns, column =>
                determineGroup(column)
            );
            displayGroups = Object.keys(displayColumns);
        }
    }

    let displayGroups: string[];
    let selectedColumn: ColumnProfileData;
    let selectedColumnName: string;

    $: displayColumns = _.groupBy(optionColumns, column =>
        determineGroup(column)
    );
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
</script>

<div class="bivariate-menu">
    <select
        bind:value={selectedColumnName}
        style={'max-width:100%'}
        disabled={!clickable}
    >
        <option value="none" selected disabled hidden>Select a column</option>
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
