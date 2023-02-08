<script lang="ts">
    import { flip } from 'svelte/animate';
    import { onDestroy, setContext } from 'svelte';
    import _ from 'lodash';
    import type { ProfileModel } from '../dataAPI/ProfileModel';
    import type { IDFProfileWState } from '../common/exchangeInterfaces';
    import { sortDFArr } from './utils/sort-utils';
    import SettingsMenu from './nav/SettingsMenu.svelte';
    import RefreshData from './nav/RefreshData.svelte';
    import DFProfile from './DFProfile.svelte';
    import Parquet from './icons/Parquet.svelte';
    import AlertIcon from './icons/AlertIcon.svelte';
    import { Circle } from 'svelte-loading-spinners';

    export let profileModel: ProfileModel;
    setContext('autoprofiler:profileModel', profileModel);

    let isReady: boolean;
    let isLoading: boolean;
    let colProfileArr: IDFProfileWState[] = [];
    let name: string;
    let varsInCurrentCell: string[];

    const readyUnsub = profileModel.ready.subscribe(val => {
        isReady = val;
    });

    const loadingUnsub = profileModel.loading.subscribe(val => {
        isLoading = val;
    });

    const cpUnsub = profileModel.columnProfiles.subscribe(val => {
        if (!_.isEmpty(val)) {
            colProfileArr = Object.values(val);
        } else {
            colProfileArr = [];
        }
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

    let sortOptions = [
        { prop: 'dfName', displayName: 'Name' },
        { prop: 'lastUpdatedTime', displayName: 'Last Updated' }
    ];
    let selectedSortOption = 'lastUpdatedTime';

    function handlePin(event) {
        profileModel.columnProfiles.update(oldVal => {
            let match = oldVal[event.detail.dfName];
            if (match) {
                match.isPinned = !match.isPinned;
            }
            return oldVal;
        });
    }

    $: sortedArr = sortDFArr(colProfileArr, selectedSortOption);
</script>

<main class="p-4 m-0 flex flex-col h-full">
    <h1 class="text-lg">AutoProfiler</h1>
    <div class="absolute top-2 right-2">
        <SettingsMenu />
    </div>
    <div class="absolute top-2 right-8">
        <RefreshData />
    </div>

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

        {#if !_.isEmpty(colProfileArr)}
            <div class="flex gap-1 items-center">
                <Parquet size="16px" />
                <h2 class="text-base">DataFrames</h2>
                <div class="grow">
                    {#if isLoading}
                        <div class="pl-2">
                            <Circle
                                size="1"
                                color="#FF3E00"
                                unit="rem"
                                duration="1s"
                            />
                        </div>
                    {/if}
                </div>

                <div class="justify-end">
                    Sort by:

                    <select
                        class="rounded border border-6 bg-gray-100 hover:border-gray-300"
                        bind:value={selectedSortOption}
                    >
                        {#each sortOptions as opt}
                            <option value={opt.prop}>{opt.displayName}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div>
                {#each sortedArr as profile (profile.dfName)}
                    <div animate:flip={{ duration: 300 }}>
                        <DFProfile
                            dfName={profile.dfName}
                            isInFocus={varsInCurrentCell.includes(
                                profile.dfName
                            )}
                            dataframeProfile={profile}
                            isPinned={profile.isPinned}
                            on:message={handlePin}
                        />
                    </div>
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

    <div class="mt-auto pt-4 w-full">
        <div>
            <span class="text-gray-500 footerItem">
                <AlertIcon size="14px" />
            </span>
            <span class="footerItem"> We want your </span>
            <a
                class="feedbackLink footerItem"
                href="https://forms.gle/V3ejpXxMcQXqYJG48"
                target="_blank"
            >
                feedback
            </a>
            <span class="footerItem"> or </span>
            <a
                class="feedbackLink footerItem"
                href="https://github.com/cmudig/AutoProfiler/issues"
                target="_blank"
            >
                create an issue!
            </a>
        </div>
    </div>
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

        /* Override default from base since clashes with jupyter */
        input {
            color: black;
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

    .feedbackLink {
        @apply font-semibold;
        color: #616161;
    }

    .footerItem {
        @apply inline-block;
        @apply align-middle;
    }
</style>
