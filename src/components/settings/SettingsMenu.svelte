<script lang="ts">
    import SettingsIcon from '../icons/SettingsIcon.svelte';
    import FloatingElement from '../tooltip/FloatingElement.svelte';
    import Portal from '../tooltip/Portal.svelte';
    import { allowLogs, showIndex } from '../../stores';

    // state
    let active = false;

    // floating params
    let parent;
</script>

<!-- A component that activates a hovering meu on click to control settings with toggles -->
<div class="settings-wrapper" bind:this={parent}>
    <button
        class="grid place-items-center rounded text-gray-500 hover:bg-gray-100"
        style="width: 25px; height: 25px;"
        on:click={() => {
            active = !active;
        }}
    >
        <SettingsIcon size="20px" />
    </button>
    {#if active}
        <Portal>
            <div style="z-index:50;">
                <FloatingElement
                    target={parent}
                    location={'bottom'}
                    distance={5}
                >
                    <div
                        class="settings-menu bg-white rounded p-2 pt-1 pb-1 flex flex-col"
                    >
                        <div class="flex gap-1 items-center">
                            <input type="checkbox" bind:checked={$allowLogs} />
                            <span>Allow logs</span>
                        </div>
                        <div class="flex gap-1 items-center">
                            <input type="checkbox" bind:checked={$showIndex} />
                            <span>Visualize DF index</span>
                        </div>
                    </div>
                </FloatingElement>
            </div>
        </Portal>
    {/if}
</div>

<style>
    .settings-menu:before {
        content: '';
        display: block;
        position: absolute;
        /* offset arrow to the middle */
        margin: 0 auto;
        left: 0;
        right: 0;
        bottom: 100%;
        /* 0 size rect */
        width: 0;
        height: 0;
        /* Make actual triangle */
        border-bottom: 6px solid #6c727f;
        border-top: 5px solid transparent;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
    }

    .settings-menu {
        border: 1px solid #6c727f;
    }
</style>
