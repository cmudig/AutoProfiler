<script lang="ts">
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import RightArrow from '../icons/RightArrow.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    import { QUANT_CHART, CAT_CHART, TEMPORAL_CHART } from './ExportableCharts';

    export let chartType: 'quant' | 'cat' | 'temporal';
    export let dfName: string;
    export let colName: string;
    export let exportOptions: {
        numBins?: number;
        shouldDisableMaxRows?: boolean;
    } = undefined;

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    function addVisCode() {
        let text: string;
        if (chartType == 'quant') {
            text = QUANT_CHART(dfName, colName, exportOptions?.numBins);
        } else if (chartType == 'cat') {
            text = CAT_CHART(dfName, colName);
        } else {
            text = TEMPORAL_CHART(
                dfName,
                colName,
                exportOptions?.shouldDisableMaxRows
            );
        }

        profileModel.notebook.addCell('code', text);
    }
</script>

<div class="flex justify-end w-full pt-1">
    <Tooltip location="bottom" alignment="center" distance={8}>
        <button
            class="hover:bg-gray-100 text-gray-400 grid place-items-center rounded"
            style="width: 16px; height: 16px;"
            on:click={addVisCode}
        >
            <RightArrow size="16px" />
        </button>

        <TooltipContent slot="tooltip-content">
            Export chart to code
        </TooltipContent>
    </Tooltip>
</div>
