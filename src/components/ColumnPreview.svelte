<script lang="ts">
    // import embed from "vega-embed";

    import type { VisualizationSpec, View } from "svelte-vega";
    import { VegaLite } from "svelte-vega";

    export let type;
    export let columnName;
    export let dataHandler;
    let colData = dataHandler.getColumn(columnName);
    let headRows = colData.data.slice(0, 3);

    let quantSpec: VisualizationSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: "a chart",
        data: {
            name: "table",
        },
        mark: "bar",
        encoding: {
            x: {
                field: "bin_0",
                bin: { binned: true },
                title: "label stuff",
            },
            x2: { field: "bin_1" },
            y: {
                field: "count",
                type: "quantitative",
            },
        },
    };

    let nomSpec: VisualizationSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: "a chart",
        data: {
            name: "table",
        },
        mark: "bar",
        encoding: {
            x: {
                field: "count",
                type: "quantitative",
            },
            y: {
                field: "col_a", // TODO
                type: "nominal",
                sort: "-x",
            },
        },
    };

    // Vegalite stuff
    let inputData = {
        table: [],
    };
    let spec;
    let colMd;

    if (type === "number") {
        let quantInfo = dataHandler.getQuantBinnedData(columnName);
        inputData.table = quantInfo["binned_data"].objects();
        // quantSpec.encoding.x["bin"]["step"] = quantInfo["bin_size"];
        quantSpec.encoding.x["title"] = columnName;
        spec = quantSpec;
        colMd = dataHandler.getQuantMeta(columnName);
    } else {
        inputData.table = dataHandler.getNomColVisData(columnName).objects();
        nomSpec.encoding["y"]["field"] = columnName;
        spec = nomSpec;
        colMd = dataHandler.getNomMeta(columnName);
    }

    // console.log("Making profile for COLUMN: ", columnName, "TYPE: ", type);
    // console.log("input data: ", inputData);
    // console.log("input spec: ", spec);

    // $: viewVL ? console.log("Vega-Lite view: ", viewVL.data("table")) : "";
</script>

<div class="ColumnProfile">
    <div class="cp-header"><b>{columnName}</b> <i>{type}</i></div>
    <div class="cp-preview">
        Preview:
        <ul class="minimalList">
            {#each headRows as row}
                <li>{row}</li>
            {/each}
        </ul>
    </div>
    <div class="cp-meta">
        MetaData:
        <ul class="minimalList">
            {#if type === "number"}
                <li>Mean: {colMd.mean}</li>
                <li>Median: {colMd.median}</li>
                <li>Number Missing: {colMd.num_invalid}</li>
            {:else}
                <li>Unique: {colMd.num_unique}</li>
                <li>Number Missing: {colMd.num_invalid}</li>
            {/if}
        </ul>
    </div>

    <div id="cp-vis">
        <VegaLite data={inputData} {spec} />
    </div>
</div>

<style>
    .ColumnProfile {
        padding-top: 5px;
        /* border-bottom: 1px dashed #e2e2e2; */
    }

    .cp-header {
        background-color: #e2e2e2;
        min-height: 35px;
    }

    .vp-vis {
        height: 250px;
        width: 100%;
    }

    .minimalList {
        list-style-type: none;
        padding-left: 10px;
        padding-top: 0;
    }
</style>
