<script lang="ts">
    import ColumnProfile from './ColumnProfile.svelte';
    import ExpanderButton from './nav/ExpanderButton.svelte';
    import { CollapsibleCard } from 'svelte-collapsible';
    import { columnProfiles } from '../stores';

    export let dfName: string;

    // locals
    let previewView = 'summaries';

    // view variables
    let profileWidth: number;
    let expanded = false;
</script>

<div>
    <CollapsibleCard bind:open={expanded}>
        <div slot="header" class="dfprofile-header">
            <div class="inline-block">
                <ExpanderButton rotated={expanded} />
            </div>
            <p class="inline-block font-bold">{dfName}</p>

            <p class="inline-block">
                {#await $columnProfiles[dfName]}
                    Loading...
                {:then cp}
                    {cp.shape[0]} x {cp.shape[1]}
                {/await}
            </p>
        </div>

        <div slot="body" class="dfprofile-body">
            {#await $columnProfiles[dfName]}
                <div />
            {:then cp}
                <div bind:clientWidth={profileWidth} class="col-profiles">
                    {#each cp.profile as column}
                        <ColumnProfile
                            example={column.example}
                            name={column.name}
                            type={column.type}
                            summary={column.summary}
                            nullCount={column.nullCount}
                            containerWidth={profileWidth}
                            view={previewView}
                            totalRows={cp.shape[0]}
                        />
                    {/each}
                </div>
            {/await}
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
