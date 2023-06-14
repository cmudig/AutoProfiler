<script lang="ts">
    import { createEventDispatcher, getContext } from 'svelte';
    import CollapsibleCard from './nav/CollapsibleCard.svelte';
    import ColumnProfile from './ColumnProfile.svelte';
    import ExpanderButton from './nav/ExpanderButton.svelte';
    import type {
        IDFProfileWState,
        IBivariateData
    } from '../common/exchangeInterfaces';
    import type { ProfileModel } from '../dataAPI/ProfileModel';
    import _ from 'lodash';
    import Pin from './icons/Pin.svelte';
    import Tooltip from './tooltip/Tooltip.svelte';
    import TooltipContent from './tooltip/TooltipContent.svelte';
    import { formatInteger } from './utils/formatters';

    import AddChartButton from './create-chart/AddChartButton.svelte';
    import BivariateWrapper from './create-chart/BivariateWrapper.svelte';

    export let dfName: string;
    export let dataframeProfile: IDFProfileWState;
    export let isInFocus = false;
    export let isPinned = false;

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    // locals
    $: warningMessage = _.isEmpty(dataframeProfile.warnings)
        ? ''
        : dataframeProfile.warnings.map(w => w.warnMsg).join(', ');

    // view variables
    let profileWidth: number;
    let expanded = false;
    let headerHover = false;

    // Bivariate variables
    let biDataStorage: IBivariateData[] = [];

    // dispatches
    const dispatch = createEventDispatcher();

    function handlePin() {
        dispatch('message', {
            dfName
        });
    }

    function handleHeaderHover(event) {
        headerHover = event?.detail?.over;
    }

    function handleDelete(i: number) {
        biDataStorage.splice(i, 1);
        biDataStorage = biDataStorage; // for reactivity
    }

    function updateSpecState(newSpec: IBivariateData, index: number) {
        biDataStorage[index] = newSpec;
        biDataStorage = biDataStorage; // for reactivity
    }

    let baseClasses = 'grid place-items-center rounded hover:bg-gray-100 ';

    // update bivariate chart whenever the associated data is updated
    function updateBivariate() {
        let biDataPromises = biDataStorage.map(d => {
            return profileModel.getBivariateData(
                dfName,
                d.xColumn,
                d.yColumn,
                d.aggrType
            );
        });
        Promise.all(biDataPromises).then(biDataArr => {
            biDataStorage = biDataArr;
        });
    }

    function addEmptyChart() {
        // only add one empty chart at a time
        if (_.isNil(biDataStorage.find(d => !d.filledOut))) {
            let emptyChart: IBivariateData = {
                xColumn: undefined,
                yColumn: undefined,
                aggrType: undefined,
                data: undefined,
                chartType: undefined,
                filledOut: false
            };

            biDataStorage = [...biDataStorage, emptyChart];
        }
    }

    $: {
        dataframeProfile.profile;
        updateBivariate();
    }
</script>

<div>
    <CollapsibleCard bind:open={expanded} on:header-hover={handleHeaderHover}>
        <div slot="header" class="dfprofile-header flex gap-1 items-center">
            <ExpanderButton rotated={expanded} />

            <div class="font-bold">
                {#if dfName == profileModel.currentOutputName}
                    Output from [{profileModel.currentOutputName.slice(1)}]
                {:else}
                    {dfName}
                {/if}
            </div>

            <p class="grow">
                {formatInteger(dataframeProfile?.shape?.[0])} x {formatInteger(
                    dataframeProfile?.shape?.[1]
                )}
            </p>

            {#if isInFocus}
                <div class="focusIndicator justify-end" />
            {/if}
        </div>

        <div slot="header-no-collapse">
            <Tooltip location="right" alignment="center" distance={8}>
                <button
                    class={baseClasses +
                        (isPinned
                            ? 'text-black'
                            : headerHover
                            ? 'text-gray-400'
                            : 'text-transparent')}
                    style="width: 16px; height: 16px;"
                    on:click={handlePin}
                >
                    <Pin size="16px" />
                </button>

                <TooltipContent slot="tooltip-content">
                    {#if isPinned}
                        Unpin
                    {:else}
                        Pin
                    {/if}
                </TooltipContent>
            </Tooltip>
        </div>

        <div slot="body" class="dfprofile-body">
            <div bind:clientWidth={profileWidth} class="col-profiles">
                {#if !_.isEmpty(warningMessage)}
                    <div class="pl-2 pr-2 pb-2">
                        <span class="bg-amber-500 rounded-md p-[3px]"
                            >Warning
                        </span>
                        {warningMessage}
                    </div>
                {/if}
                {#if dataframeProfile?.shape?.[1] > 0}
                    {#each dataframeProfile?.profile as column (column.colName)}
                        <ColumnProfile
                            {dfName}
                            colName={column.colName}
                            type={column.colType}
                            summary={column.summary}
                            nullCount={column.nullCount}
                            containerWidth={profileWidth}
                            totalRows={dataframeProfile?.shape?.[0]}
                            isIndex={column.colIsIndex}
                        />
                    {/each}
                {:else}
                    <p class="pl-8">No columns!</p>
                {/if}

                {#each biDataStorage as d, idx}
                    <BivariateWrapper
                        biData={d}
                        columnOptions={dataframeProfile?.profile}
                        {dfName}
                        on:specChange={event => {
                            updateSpecState(event.detail, idx);
                        }}
                        on:delete={() => {
                            handleDelete(idx);
                        }}
                    />
                {/each}

                <div class="mt-1">
                    <AddChartButton handleAddChart={addEmptyChart} />
                </div>
            </div>
        </div>
    </CollapsibleCard>
</div>

<style>
    .col-profiles {
        width: 100%;
    }

    .dfprofile-header {
        margin: 0;
        padding: 0.5em;
    }

    .dfprofile-body {
        display: flex;
    }

    .focusIndicator {
        height: 10px;
        width: 10px;
        background-color: #1976d2;
        border-radius: 2px;
    }

    .bivariate-menu {
        width: 50%;
    }
</style>
