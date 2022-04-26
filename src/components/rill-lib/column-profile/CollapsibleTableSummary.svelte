<script lang="ts">
    import type { SvelteComponent } from 'svelte/internal';
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import { tweened } from 'svelte/motion';
    import { cubicInOut as easing } from 'svelte/easing';
    // import { format } from "d3-format";

    // import Menu from "../menu/Menu.svelte";
    // import MenuItem from "../menu/MenuItem.svelte";
    import * as classes from '../util/component-classes';
    // import FloatingElement from "../tooltip/FloatingElement.svelte";
    import Spacer from '../icons/Spacer.svelte';
    // import MoreIcon from "../icons/MoreHorizontal.svelte";
    // import Shortcut from "../tooltip/Shortcut.svelte";
    // import StackingWord from "../tooltip/StackingWord.svelte";
    // import TooltipShortcutContainer from "../tooltip/TooltipShortcutContainer.svelte";
    // import TooltipTitle from "../tooltip/TooltipTitle.svelte";
    // import ContextButton from "./ContextButton.svelte";
    import ColumnProfile from './ColumnProfile.svelte';
    // import NavEntry from "./NavEntry.svelte";
    import { defaultSort, sortByNullity, sortByName } from './sort-utils';

    // import { dropStore } from '../drop-store';

    // import notificationStore from "./notifications/";

    // import { onClickOutside } from "../util/on-click-outside";
    import { config } from './utils';

    export let icon: SvelteComponent;
    export let name: string;
    export let path: string;
    export let cardinality: number;
    export let profile: any[];
    export let head: any[]; // FIXME
    export let sizeInBytes: number;
    export let emphasizeTitle: boolean = false;
    export let draggable = true;
    export let show = false;
    export let showTitle = true;
    export let showContextButton = true;
    export let indentLevel = 0;

    // const dispatch = createEventDispatcher();

    // const formatInteger = format(',');

    let containerWidth = 0;
    // let contextMenu;
    // let contextMenuOpen = false;
    let container: any;

    onMount(() => {
        const observer = new ResizeObserver(entries => {
            containerWidth = container?.clientWidth ?? 0;
        });
        observer.observe(container);
    });

    let cardinalityTween = tweened(cardinality, { duration: 600, easing });
    let sizeTween = tweened(sizeInBytes, { duration: 650, easing, delay: 150 });

    $: cardinalityTween.set(cardinality || 0);
    // $: interimCardinality = ~~$cardinalityTween;
    $: sizeTween.set(sizeInBytes || 0);

    // let selectingColumns = false;
    // let selectedColumns = [];

    let sortedProfile: any[];
    function sortByOriginalOrder() {
        sortedProfile = profile;
    }

    let sortMethod = defaultSort;
    // this predicate actually is valid but typescript doesn't seem to agree.
    // @ts-ignore
    $: if (sortMethod !== sortByOriginalOrder) {
        sortedProfile = [...profile].sort(sortMethod);
    } else {
        sortedProfile = profile;
    }

    let previewView = 'summaries';
</script>

<div bind:this={container}>
    {#if show}
        <div class="pt-1 pb-3 pl-accordion" transition:slide|local={{ duration: 120 }}>
            <!-- pl-16 -->
            <div class="pl-{indentLevel === 1 ? '10' : '4'} pr-5 pb-2 flex justify-between text-gray-500" class:flex-col={containerWidth < 325}>
                <select
                    style:transform="translateX(-4px)"
                    bind:value={sortMethod}
                    class={classes.NATIVE_SELECT}
                >
                    <option value={sortByOriginalOrder}
                        >show original order</option
                    >
                    <option value={defaultSort}>sort by type</option>
                    <option value={sortByNullity}>sort by null %</option>
                    <option value={sortByName}>sort by name</option>
                </select>
                <select
                    style:transform="translateX(4px)"
                    bind:value={previewView}
                    class={classes.NATIVE_SELECT}
                    class:hidden={containerWidth < 325}
                >
                    <option value="summaries">show summary&nbsp;</option>
                    <option value="example">show example</option>
                </select>
            </div>

            <div>
                {#if sortedProfile && sortedProfile.length && head.length}
                    {#each sortedProfile as column (column.name)}
                        <ColumnProfile
                            {indentLevel}
                            example={head[0][column.name] || ''}
                            {containerWidth}
                            hideNullPercentage={containerWidth <
                                config.hideNullPercentage}
                            hideRight={containerWidth < config.hideRight}
                            compactBreakpoint={config.compactBreakpoint}
                            view={previewView}
                            name={column.name}
                            type={column.type}
                            summary={column.summary}
                            totalRows={cardinality}
                            nullCount={column.nullCount}
                        >
                            <button slot="context-button" class:hidden={!showContextButton}>
                                <Spacer size="16px" />
                            </button>
                        </ColumnProfile>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
</div>
