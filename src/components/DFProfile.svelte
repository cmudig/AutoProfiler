<script lang="ts">
    import { CollapsibleCard } from 'svelte-collapsible';
    import ColumnProfile from './ColumnProfile.svelte';
    import ExpanderButton from './nav/ExpanderButton.svelte';
    import type { IColumnProfileWrapper } from '../common/exchangeInterfaces';
    import Tooltip from './tooltip/Tooltip.svelte';
    import TooltipContent from './tooltip/TooltipContent.svelte';

    export let dfName: string;
    export let dataframeProfile: IColumnProfileWrapper;

    // locals
    let previewView = 'summaries';

    // view variables
    let profileWidth: number;
    let expanded = false;
</script>

<div>
    <CollapsibleCard bind:open={expanded}>
        <div slot="header" class="dfprofile-header flex gap-2">
            <ExpanderButton rotated={expanded} />

            <p class="font-bold">{dfName}</p>
            <p class="grow">
                {dataframeProfile?.shape?.[0]} x {dataframeProfile?.shape?.[1]}
            </p>
            <div class="flex justify-end">
                {#if dataframeProfile.lastUpdatedExCount}
                    <Tooltip location="top" distance={8}>
                        <span class="font-mono bold text-gray-500">
                            [{dataframeProfile.lastUpdatedExCount}]
                        </span>
                        <TooltipContent slot="tooltip-content">
                            Last updated in cell <span class="font-mono bold">
                                [{dataframeProfile.lastUpdatedExCount}]
                            </span>
                        </TooltipContent>
                    </Tooltip>
                {/if}
            </div>
        </div>

        <div slot="body" class="dfprofile-body">
            <div bind:clientWidth={profileWidth} class="col-profiles">
                {#if dataframeProfile?.shape?.[1] > 0}
                    {#each dataframeProfile?.profile as column}
                        <ColumnProfile
                            example={column.example}
                            name={column.name}
                            type={column.type}
                            summary={column.summary}
                            nullCount={column.nullCount}
                            containerWidth={profileWidth}
                            view={previewView}
                            totalRows={dataframeProfile?.shape?.[0]}
                        />
                    {/each}
                {:else}
                    <p class="pl-8">No columns!</p>
                {/if}
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
</style>
