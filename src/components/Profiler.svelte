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
    let language: string;
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

    const langUnsub = profileModel.language.subscribe(val => {
        language = val;
    });

    onDestroy(() => {
        readyUnsub();
        loadingUnsub();
        cpUnsub();
        nameUnsub();
        varsInCellUnsub();
        langUnsub();
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

        {#if language === 'python' || language === 'python3'}
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
                                <option value={opt.prop}
                                    >{opt.displayName}</option
                                >
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
                    All Pandas dataframes in your jupyter notebook will be
                    profiled below.
                </p>
                <p class="italic">No DataFrames detected yet!</p>
            {/if}
        {:else}
            <p>
                AutoProfiler only supports Python notebooks, currently connected
                to a <span class="font-bold">{language}</span> notebook.
            </p>
        {/if}
    {:else}
        <p>No notebook connection or executions yet.</p>
    {/if}

    <div class="mt-auto pt-4 w-full flex gap-1 items-center">
        <span class="text-gray-500 grid place-items-center">
            <AlertIcon size="14px" />
        </span>
        <div>
            Submit your
            <a
                class="feedbackLink"
                href="https://forms.gle/V3ejpXxMcQXqYJG48"
                target="_blank"
            >
                feedback
            </a>
            or
            <a
                class="feedbackLink"
                href="https://github.com/cmudig/AutoProfiler/issues"
                target="_blank"
            >
                create an issue.
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

        img,
        svg,
        video,
        canvas,
        audio,
        iframe,
        embed,
        object {
            display: unset;
            vertical-align: unset;
        }
    }

    /* My styles */
    .feedbackLink {
        @apply font-semibold;
        color: #616161;
    }
</style>
