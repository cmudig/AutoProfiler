<script lang="ts">
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import ExportIcon from '../icons/ExportIcon.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    import {
        DUPLICATES,
        IQR_OUTLIERS,
        HAMPEL_OUTLIERS,
        SD_OUTLIERS
    } from './ExportableCode';

    export let type:
        | 'outliers_iqr'
        | 'outliers_sd'
        | 'outlier_hampel'
        | 'duplicates';
    export let dfName: string;
    export let colName: string;
    export let isIndex = false;
    export let tooltipText = 'Export text fact to code';

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    function addCode() {
        let text: string;
        if (type === 'outliers_iqr') {
            text = IQR_OUTLIERS(dfName, colName, isIndex);
        } else if (type === 'outliers_sd') {
            text = SD_OUTLIERS(dfName, colName, isIndex);
        } else if (type === 'outlier_hampel') {
            text = HAMPEL_OUTLIERS(dfName, colName, isIndex);
        } else if (type === 'duplicates') {
            text = DUPLICATES(dfName, colName, isIndex);
        }
        profileModel.addCell('code', text);
    }
</script>

<Tooltip location="bottom" alignment="center" distance={8}>
    <button
        class="grid place-items-center rounded hover:bg-gray-100 text-gray-500"
        style="width: 20px; height: 20px;"
        on:click={addCode}
    >
        <ExportIcon size="12px" />
    </button>

    <TooltipContent slot="tooltip-content">{tooltipText}</TooltipContent>
</Tooltip>
