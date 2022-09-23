<script lang="ts">
    import _ from 'lodash';
    import DFProfile from './DFProfile.svelte';
    import {
        columnProfiles,
        dataFramesAndCols,
        profileModel,
        isLoadingNewData
    } from '../stores';
    import Parquet from './icons/Parquet.svelte';
    import { Circle } from 'svelte-loading-spinners';

    // Locals
    let name: string;
    let lang: Promise<string>;

    $: if ($dataFramesAndCols && $profileModel) {
        name = $profileModel.name;
        lang = $profileModel.language;
    }
</script>

<main class="p-4 m-0">
    <h1 class="text-lg">AutoProfile</h1>

    {#if $profileModel.ready}
        <!-- <div id="header-icon" /> -->
        <div class="mb-4">
            <p>
                {name} is a
                <span class="font-semibold">
                    {#await lang} ? {:then lang} {lang} {/await}
                </span>
                notebook.
            </p>
        </div>

        {#if !_.isEmpty($columnProfiles)}
            <div>
                <div class="inline-block align-middle">
                    <Parquet size="16px" />
                </div>
                <h2 class="inline-block align-middle">DataFrames</h2>
                {#if $isLoadingNewData}
                    <div class="inline-block align-middle pl-2">
                        <Circle
                            size="1"
                            color="#FF3E00"
                            unit="rem"
                            duration="1s"
                        />
                    </div>
                {/if}
            </div>

            <div>
                {#each Object.keys($columnProfiles) as dfName}
                    <DFProfile {dfName} />
                {/each}
            </div>
        {:else}
            <p class="mb-4">
                All Pandas dataframes in your jupyter notebook will be profiled
                below.
            </p>
            <p class="italic">No DataFrames detected yet!</p>
        {/if}
    {:else}
        <p>No notebook connection or executions yet.</p>
    {/if}
</main>

<style global lang="postcss">
    /* TAILWIND stuff */
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer base {
        h1,
        h2,
        h3,
        h4 {
            @apply font-semibold;
        }
    }

    /* ::selection {
        background-color: black;
        color: white;
    } */

    /* html {
        @apply bg-gray-400;
    } */

    /* button {
        font-family: 'MD IO';
    } */

    .ͼ1 .cm-scroller {
        /* font-family: 'MD IO'; */
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

    .draggable:active {
        cursor: dragging;
    }

    .ͼ2 .cm-gutters {
        background-color: transparent;
        border-right: none;
    }
</style>
