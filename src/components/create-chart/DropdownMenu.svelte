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
    export let selectedColumnName: string = undefined;

    let displayGroups: string[];

    function determineGroup(column: IColTypeTuple) {
        if (NUMERICS.has(column.colType)) {
            return 'Numeric';
        } else if (TIMESTAMPS.has(column.colType)) {
            return 'Timestamp';
        } else if (CATEGORICALS.has(column.colType)) {
            return 'Categorical';
        } else {
            return 'Other';
        }
    }

    function filterByType(columnProfile: IColTypeTuple) {
        if (columnProfile != undefined) {
            let columns: IColTypeTuple[];
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

            // if column was already selected and no longer available then set undefined
            if (
                !_.isNil(selectedColumnName) &&
                _.isNil(columns.find(c => c.colName === selectedColumnName))
            ) {
                selectedColumnName = undefined;
            }
        }
    }

    $: displayColumns = _.groupBy(columnOptions, column =>
        determineGroup(column)
    );
    $: displayGroups = Object.keys(displayColumns);

    $: filterByType(filteringColumn);

    function handleSelectedColumn(colName: string) {
        let selectedColumn = columnOptions.filter(
            colData => colData.colName === colName
        )[0];

        dispatch('select', selectedColumn);
    }

    $: handleSelectedColumn(selectedColumnName);
</script>

<div>
    <select
        class="rounded border border-6 bg-gray-100 hover:border-gray-300 pl-1 pr-1 disabled:cursor-not-allowed"
        bind:value={selectedColumnName}
        disabled={!clickable}
    >
        <option value={undefined} disabled hidden>{title}</option>
        {#each displayGroups as group}
            <optgroup label={group}>
                {#each displayColumns[group] as column}
                    <option value={column.colName}>{column.colName}</option>
                {/each}
            </optgroup>
        {/each}
    </select>
</div>
