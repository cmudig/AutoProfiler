<script lang="ts">
    import { CollapsibleCard } from 'svelte-collapsible';
    import ColumnProfile from './ColumnProfile.svelte';
    import ExpanderButton from './nav/ExpanderButton.svelte';
    import type { IColumnProfileWrapper } from '../common/exchangeInterfaces';

    export let dfName: string;
    export let dataframeProfile: IColumnProfileWrapper;
    export let isInFocus = false;

    // locals
    let previewView = 'summaries';

    // view variables
    let profileWidth: number;
    let expanded = false;
</script>

<div>
    <CollapsibleCard bind:open={expanded}>
        <div slot="header" class="dfprofile-header flex gap-1 items-center">
            <ExpanderButton rotated={expanded} />

            <p class="font-bold">{dfName}</p>

            <p class="grow">
                {dataframeProfile?.shape?.[0]} x {dataframeProfile?.shape?.[1]}
            </p>

            {#if isInFocus}
                <div class="focusIndicator justify-end" />
            {/if}
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

    .focusIndicator {
        height: 10px;
        width: 10px;
        background-color: #1976d2;
        border-radius: 2px;
    }
</style>
