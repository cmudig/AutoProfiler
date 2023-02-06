<script lang="ts">
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import RightArrow from '../icons/RightArrow.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    import { DUPLICATES, IQR_OUTLIERS, SD_OUTLIERS } from './ExportableCode';

    export let type: 'iqr' | 'sd' | 'unique';
    export let dfName: string;
    export let colName: string;
    export let isIndex = false;

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    function addVisCode() {
        let text: string;
        if (type === 'iqr') {
            text = IQR_OUTLIERS(dfName, colName, isIndex);
        } else if (type === 'sd') {
            text = SD_OUTLIERS(dfName, colName, isIndex);
        } else if (type === 'unique') {
            text = DUPLICATES(dfName, colName, isIndex);
        }
        profileModel.addCell('code', text);
    }
</script>

<div class="flex justify-end w-full">
    <Tooltip location="bottom" alignment="center" distance={8}>
        <button
            class="hover:bg-gray-100 text-gray-400 grid place-items-center rounded"
            style="width: 16px; height: 16px;"
            on:click={addVisCode}
        >
            <RightArrow size="16px" />
        </button>

        <TooltipContent slot="tooltip-content">
            Export text fact to code
        </TooltipContent>
    </Tooltip>
</div>
