<script lang="ts">
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import RefreshIcon from '../icons/RefreshIcon.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    function refreshData() {
        profileModel.resetData();
        profileModel.updateRootData();
    }
</script>

<div class="flex items-center">
    <div class="grow" />

    <div class="justify-end">
        <Tooltip location="bottom" alignment="center" distance={8}>
            <button
                class="grid place-items-center rounded text-gray-500 hover:bg-gray-100"
                style="width: 25px; height: 25px;"
                on:click={refreshData}
            >
                <RefreshIcon size="20px" />
            </button>

            <TooltipContent slot="tooltip-content"
                >Manually refresh data</TooltipContent
            >
        </Tooltip>
    </div>
</div>
