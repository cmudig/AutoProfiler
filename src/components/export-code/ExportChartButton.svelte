<script lang="ts">
    import { getContext } from 'svelte';
    import type { ProfileModel } from '../../dataAPI/ProfileModel';
    import ExportIcon from '../icons/ExportIcon.svelte';
    import Tooltip from '../tooltip/Tooltip.svelte';
    import TooltipContent from '../tooltip/TooltipContent.svelte';

    import { QUANT_CHART, CAT_CHART, TEMPORAL_CHART } from './ExportableCode';

    export let chartType: 'quant' | 'cat' | 'temporal';
    export let dfName: string;
    export let colName: string;
    export let exportOptions: {
        numBins?: number;
        shouldDisableMaxRows?: boolean;
    } = undefined;
    export let isIndex = false;

    const profileModel: ProfileModel = getContext('autoprofiler:profileModel');

    function addVisCode() {
        let text: string;
        if (chartType == 'quant') {
            text = QUANT_CHART(
                dfName,
                colName,
                exportOptions?.numBins,
                isIndex
            );
        } else if (chartType == 'cat') {
            text = CAT_CHART(dfName, colName, 10, isIndex);
        } else {
            text = TEMPORAL_CHART(
                dfName,
                colName,
                exportOptions?.shouldDisableMaxRows,
                isIndex
            );
        }

        profileModel.addCell('code', text);
    }
</script>

<div class="flex items-center">
    <div class="grow" />

    <div class="justify-end">
        <Tooltip location="bottom" alignment="center" distance={8}>
            <button
                class="flex items-center w-full gap-1 hover:bg-gray-100 text-gray-500 pl-1 pr-1"
                on:click={addVisCode}
            >
                <p>Export</p>
                <ExportIcon size="12px" />
            </button>

            <TooltipContent slot="tooltip-content"
                >Export chart to code</TooltipContent
            >
        </Tooltip>
    </div>
</div>
