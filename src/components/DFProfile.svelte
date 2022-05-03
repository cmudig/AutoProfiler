<script lang="ts">
    import ColumnProfile from './ColumnProfile.svelte';
    import ExpanderButton from './nav/ExpanderButton.svelte';
    import type {
        // IColTypeTuple,
        ColumnProfileData
    } from '../common/exchangeInterfaces';
    import { CollapsibleCard } from 'svelte-collapsible';
    import { columnProfiles } from '../stores';

    export let dfName: string;
    // export let colInfo: IColTypeTuple[];

    // $: console.log('[SVELTE] Making DFProfile for ', dfName, ' with ', colInfo);
    // export let profileModel: ProfileModel;

    // Locals
    let shape: number[] = [undefined, undefined];
    let cp: ColumnProfileData[];
    let previewView = 'summaries';

    $: console.log(
        'Making DF Profile with data for column ',
        dfName,
        'with data',
        $columnProfiles?.[dfName]
    );

    $: if ($columnProfiles) {
        shape = $columnProfiles[dfName]?.shape;
        cp = $columnProfiles[dfName]?.profile;
    }

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
                {shape[0]} x {shape[1]}
            </p>
        </div>

        <div slot="body" class="dfprofile-body">
            {#if cp}
                <div bind:clientWidth={profileWidth} class="col-profiles">
                    {#each cp as column}
                        <ColumnProfile
                            example={column.example}
                            name={column.name}
                            type={column.type}
                            summary={column.summary}
                            nullCount={column.nullCount}
                            containerWidth={profileWidth}
                            view={previewView}
                            totalRows={shape[0]}
                        />
                    {/each}
                </div>
            {/if}
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
