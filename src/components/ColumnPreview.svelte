<script lang="ts">
    import type { VisualizationSpec } from 'svelte-vega';
    import { VegaLite } from 'svelte-vega';
    import type { ProfileModel } from '../ProfileModel';

    // import type {IQuantMeta, INomMeta} from '../dataAPI/exchangeInterfaces';

    export let type: string;
    export let columnName: string;
    export let dfName: string;
    export let profileModel: ProfileModel;

    console.log(`Making column preview for ${dfName}.${columnName}`)

    let headRows: Promise<string[]> = profileModel.getColHeadRows(dfName, columnName);

    let quantSpec: VisualizationSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'a chart',
        data: {
            name: 'table'
        },
        mark: 'bar',
        encoding: {
            x: {
                field: 'bin_0',
                bin: { binned: true },
                title: 'label stuff'
            },
            x2: { field: 'bin_1' },
            y: {
                field: 'count',
                type: 'quantitative'
            }
        }
    };

    let nomSpec: VisualizationSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'a chart',
        data: {
            name: 'table'
        },
        mark: 'bar',
        encoding: {
            x: {
                field: 'count',
                type: 'quantitative'
            },
            y: {
                field: 'col_a',
                type: 'nominal',
                sort: '-x'
            }
        }
    };

    // Vegalite stuff
    let inputData: { table: any[] } = {
        table: []
    };
    let spec: Promise<VisualizationSpec>;
    // let colMd: IQuantMeta | INomMeta;
    let colMd: Promise<any>;

    async function getQuantInfo() {
        let quantInfo = await profileModel.getQuantBinnedData(dfName, columnName);
        inputData.table = quantInfo['binned_data'];
        // quantSpec.encoding.x["bin"]["step"] = quantInfo["bin_size"];
        // @ts-ignore
        quantSpec.encoding.x['title'] = columnName;
        return new Promise(resolve => resolve(quantSpec));
    }

    async function getNomInfo() {
        inputData.table = await profileModel.getNomColVisData(dfName, columnName);

        // @ts-ignore
        nomSpec.encoding['y']['field'] = columnName;
        // spec = nomSpec;
        return new Promise(resolve => resolve(nomSpec));
    }

    // TODO put these type in an enum or something
    if (type === 'int64' || type === 'float64') {
        spec = getQuantInfo();
        colMd = profileModel.getQuantMeta(dfName, columnName);
    } else {
        spec = getNomInfo();
        colMd = profileModel.getNomMeta(dfName, columnName);
    }
</script>

<div class="ColumnProfile">
    <div class="cp-header"><b>{columnName}</b> <i>{type}</i></div>
    <div class="cp-preview">
        Preview:
        {#await headRows}
            Getting preview...
        {:then headRows}
            <ul class="minimalList">
                {#each headRows as row}
                    <li>{row}</li>
                {/each}
            </ul>
        {:catch error}
            <p>ERROR getting head rows for {columnName} -- {error}</p>
        {/await}
    </div>
    <div class="cp-meta">
        MetaData:
        {#await colMd}
            Getting column metadata...
        {:then colMd}
            <ul class="minimalList">
                {#if type === 'int64' || type === 'float64'}
                    <li>Mean: {colMd?.mean}</li>
                    <li>Median: {colMd?.median}</li>
                    <li>Number Missing: {colMd?.num_invalid}</li>
                {:else}
                    <li>Unique: {colMd?.num_unique}</li>
                    <li>Number Missing: {colMd?.num_invalid}</li>
                {/if}
            </ul>
        {:catch error}
            <p>ERROR getting metadata for {columnName} -- {error}</p>
        {/await}
    </div>

    <div id="cp-vis">
        {#await spec}
            Loading vis...
        {:then spec}
            <VegaLite spec={spec} data={inputData} />
        {:catch error}
            <p>ERROR producing visualization for {columnName} -- {error}</p>
        {/await}
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
