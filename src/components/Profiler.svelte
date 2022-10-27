<script lang="ts">
    import { onDestroy } from 'svelte';
    import _ from 'lodash';
    import type { ProfileModel } from '../dataAPI/ProfileModel';
    import type { IColumnProfileMap } from '../common/exchangeInterfaces';

    import DFProfile from './DFProfile.svelte';
    import Parquet from './icons/Parquet.svelte';
    import { Circle } from 'svelte-loading-spinners';

    export let profileModel: ProfileModel;

    let isReady: boolean;
    let isLoading: boolean;
    let columnProfiles: IColumnProfileMap;
    let name: string;
    let varsInCurrentCell: string[];

    const readyUnsub = profileModel.ready.subscribe(val => {
        isReady = val;
    });

    const loadingUnsub = profileModel.loading.subscribe(val => {
        isLoading = val;
    });

    const cpUnsub = profileModel.columnProfiles.subscribe(val => {
        columnProfiles = val;
    });

    const nameUnsub = profileModel.name.subscribe(val => {
        name = val;
    });

    const varsInCellUnsub = profileModel.variablesInCurrentCell.subscribe(
        val => {
            varsInCurrentCell = val;
        }
    );

    onDestroy(() => {
        readyUnsub();
        loadingUnsub();
        cpUnsub();
        nameUnsub();
        varsInCellUnsub();
    });
</script>

<main class="p-4 m-0">
    <h1 class="text-lg">AutoProfiler</h1>

    {#if isReady}
        <!-- <div id="header-icon" /> -->
        <div class="mb-4">
            <p>
                Connected to:
                <span class="font-semibold">
                    {name}
                </span>
            </p>
        </div>

        {#if !_.isEmpty(columnProfiles)}
            <div>
                <div class="inline-block align-middle">
                    <Parquet size="16px" />
                </div>
                <h2 class="inline-block align-middle">DataFrames</h2>
                {#if isLoading}
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
                {#each Object.keys(columnProfiles) as dfName}
                    <DFProfile
                        {dfName}
                        isInFocus={varsInCurrentCell.includes(dfName)}
                        dataframeProfile={columnProfiles[dfName]}
                    />
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
