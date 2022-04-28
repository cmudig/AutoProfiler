<script lang="ts">
    // import "../app.css" // maybe this works?
    import DFProfile from './DFProfile.svelte';
    import { dataFramesAndCols } from '../stores';
    import type { ProfileModel } from '../ProfileModel';

    export let profileModel: ProfileModel;

    // Locals
    let name: string;
    let lang: Promise<string>;

    $: if ($dataFramesAndCols) {
        name = profileModel.name;
        lang = profileModel.language;
    }
</script>

<main class="p-4 m-0">
    <h1>Dataframe Profiler</h1>

    {#if $dataFramesAndCols}
        <!-- <div id="header-icon" /> -->
        <div class="mb-4">
            <p>
                {name} is a
                <span class="bold">
                    {#await lang}
                        ?
                    {:then lang}
                        {lang}
                    {/await}
                </span>
                notebook.
            </p>
        </div>

        <div>
            {#each Object.keys($dataFramesAndCols) as dfName}
                <DFProfile
                    {dfName}
                    colInfo={$dataFramesAndCols[dfName]}
                    {profileModel}
                />
            {/each}
        </div>
    {:else}
        <p>
            All Pandas dataframes in your jupyter notebook will be profiled
            below (no data yet).
        </p>
    {/if}
</main>

<!-- <style>
    main {
        /* text-align: center; */
        padding: 1em;
        /* max-width: 240px; */
        margin: 0 auto;
    }

    .notebook-info {
        margin-bottom: 1em;
    }

    /* .df-cards  {
        margin-bottom: 1em;
    } */
</style> -->
<style global lang="postcss">
    /* TAILWIND stuff */
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    /* @layer base {
        h1,
        h2,
        h3,
        h4 {
            @apply font-bold;
        }
    } */

    ::selection {
        background-color: black;
        color: white;
    }

    html {
        @apply bg-gray-400;
    }

    body {
        font-family: 'MD IO';
        font-size: 12px;

        /* Use this for a few keyboard characters in tooltips, etc. */
        /* --system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol'; */
        margin: 0;
        padding: 0;
        --header-height: 3.5rem;
        --right-drawer-width: 400px;

        --left-sidebar-width: 400px;

        --hue: 217;
        --sat: 20%;
        --lgt: 95%;

        --info-bg: hsl(var(--hue), var(--sat), 80%);
        --info-text: hsl(var(--hue), var(--sat), 20%);

        --error-bg: hsl(1, 60%, 90%);
        --error-text: hsl(1, 60%, 30%);

        overscroll-behavior: none;
    }

    .body {
        background-color: blue;
    }

    button {
        font-family: 'MD IO';
    }

    .ͼ1 .cm-scroller {
        font-family: 'MD IO';
        font-size: 13px;
    }

    .stack-list > * + * {
        margin-top: var(--gap, 1rem);
    }

    .stack + .stack {
        margin-top: var(--gap, 1rem);
    }

    .button {
        padding: 0;
        margin: 0;
        padding: 0.5rem 1rem;
        font-weight: bold;
        background-color: black;
        color: white;
        border: none;
    }

    .small-action-button,
    .inspector-button {
        padding: 0;
        margin: 0;
        background: transparent;
        border: 1px solid transparent;
        font-size: 0.75rem;
        width: 1.5rem;
        height: 1.5rem;
        color: hsl(217, 5%, 60%);
        display: inline-grid;
        place-items: center;
    }

    .small-action-button:hover {
        background-color: hsl(217, 15%, 95%);
        cursor: pointer;
        color: black;
    }

    .small-action-button.selected {
        background-color: hsl(217, 15%, 85%);
        color: black;
    }

    .table-container {
        width: max-content;
    }

    .table-container table {
        font-size: 13px;
        text-align: right;
        hyphens: none;
        word-break: keep-all;
        min-width: 100%;
    }

    .table-container td,
    .table-container th {
        padding: 0px 0.5rem;
    }

    .table-container td {
        vertical-align: top;
        white-space: nowrap;
    }

    .table-container th {
        font-weight: 500;
        font-style: italic;
    }
    .hljs-punctuation {
        color: #bbb;
    }

    .hljs-attr {
        font-weight: 500;
    }

    .hljs-string,
    .hljs-number {
        color: hsl(217, 1%, 50%);
    }

    .gutter-indicator {
        width: 18px;
        display: grid;
        place-items: center;
        height: 18px;
    }

    /* .pl-accordion {
    padding-left: calc(14px + .25rem);
} */

    .draggable:active {
        cursor: dragging;
    }

    .ͼ2 .cm-gutters {
        background-color: transparent;
        border-right: none;
    }
</style>
