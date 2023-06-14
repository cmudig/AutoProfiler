<script lang="ts">
    import _ from 'lodash';
    import { slide } from 'svelte/transition';
    import { getContext } from 'svelte';

    import type { ProfileModel } from '../../dataAPI/ProfileModel';

    import type {
        IColTypeTuple,
        IBivariateData,
        AggrType
    } from '../../common/exchangeInterfaces';

    import CreateChartMenu from './CreateChartMenu.svelte';
    import BivariateChartEntry from './BivariateChartEntry.svelte';

    import { createEventDispatcher } from 'svelte';
    import BivariateIcon from '../icons/BivariateIcon.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';
    import ColumnEntry from '../ColumnEntry.svelte';

    // props
    export let biData: IBivariateData;
    export let columnOptions: IColTypeTuple[];
    export let dfName: string;

    // state
    let inEditMode = false;
    let active = false;

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    let title;
    // check every time
    $: if (biData.filledOut) {
        title = `${biData.xColumn.colName} vs ${biData.yColumn.colName}`;
    } else {
        title = 'New chart';
    }

    // check only on first render
    if (!biData.filledOut) {
        active = true;
        inEditMode = true;
    }

    const dispatch = createEventDispatcher();

    function handleAggrChange(aggrType: AggrType) {
        profileModel
            .getBivariateData(dfName, biData.xColumn, biData.yColumn, aggrType)
            .then(d => {
                if (!_.isNil(d)) {
                    biData = d;
                    dispatch('specChange', biData);
                }
            });
    }

    function handleColumnEdit(col1: IColTypeTuple, col2: IColTypeTuple) {
        profileModel
            .getBivariateData(dfName, col1, col2, biData.aggrType)
            .then(d => {
                if (!_.isNil(d)) {
                    biData = d;
                    dispatch('specChange', biData);
                }
            });
    }
</script>

<ColumnEntry hideRight={true} bind:active hoverKey={title} dfName={''}>
    <svelte:fragment slot="icon">
        <Tooltip location="left" distance={16}>
            <div class="text-gray-400">
                <BivariateIcon size="16px" />
            </div>

            <TooltipContent slot="tooltip-content">XY chart</TooltipContent>
        </Tooltip>
    </svelte:fragment>

    <svelte:fragment slot="left">
        {title}
    </svelte:fragment>

    <svelte:fragment slot="details">
        {#if active}
            <div
                transition:slide|local={{ duration: 200 }}
                class="pt-1 pb-1 pl-3 pr-3 w-full"
            >
                <!-- editor -->
                {#if inEditMode}
                    <div class="mb-1">
                        <CreateChartMenu
                            {columnOptions}
                            xVariable={biData.xColumn}
                            yVariable={biData.yColumn}
                            aggrType={biData.aggrType}
                            bind:inEditMode
                            on:columnEdit={event => {
                                handleColumnEdit(
                                    event.detail.xVariable,
                                    event.detail.yVariable
                                );
                            }}
                            on:aggrEdit={event => {
                                handleAggrChange(event.detail.aggrType);
                            }}
                            on:delete={() => {
                                dispatch('delete');
                            }}
                        />
                    </div>
                {/if}

                <!-- chart -->
                {#if biData.filledOut}
                    <BivariateChartEntry
                        {biData}
                        allowEdit={!inEditMode}
                        on:triggerEdit={() => {
                            inEditMode = true;
                        }}
                    />
                {/if}
            </div>
        {/if}
    </svelte:fragment>
</ColumnEntry>
