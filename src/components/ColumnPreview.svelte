<script lang="ts">
    import type { VisualizationSpec } from 'svelte-vega';
    import { VegaLite } from 'svelte-vega';
    import type { ProfileModel } from '../ProfileModel';
    import { CollapsibleCard } from 'svelte-collapsible';
    // import type {IQuantMeta, INomMeta} from '../dataAPI/exchangeInterfaces';

    export let col_type: string;
    export let columnName: string;
    export let dfName: string;
    export let profileModel: ProfileModel;
    export let idx: number;

    // locals init
    let headRows: Promise<string[]>;

    $: console.log(
        `[SVELTE] Making column preview for ${dfName}.${columnName} with index ${idx}`
    );

    $: headRows = profileModel.getColHeadRows(dfName, columnName);

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
                title: null
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
                sort: '-x',
                title: null
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
        let quantInfo = await profileModel.getQuantBinnedData(
            dfName,
            columnName
        );
        inputData.table = quantInfo['binned_data'];
        // quantSpec.encoding.x["bin"]["step"] = quantInfo["bin_size"];
        // @ts-ignore
        // quantSpec.encoding.x['title'] = columnName;
        return new Promise(resolve => resolve(quantSpec));
    }

    async function getNomInfo() {
        inputData.table = await profileModel.getNomColVisData(
            dfName,
            columnName
        );

        // @ts-ignore
        nomSpec.encoding['y']['field'] = columnName;
        // spec = nomSpec;
        return new Promise(resolve => resolve(nomSpec));
    }

    // TODO put these type in an enum or something
    $: {
        console.log(`Updating column data for ${dfName}.${columnName}`);
        if (col_type === 'int64' || col_type === 'float64') {
            spec = getQuantInfo();
            colMd = profileModel.getQuantMeta(dfName, columnName);
        } else {
            spec = getNomInfo();
            colMd = profileModel.getNomMeta(dfName, columnName);
        }
    }
</script>

<div class="column-profile">
    <CollapsibleCard open={false}>
        <div
            slot="header"
            class={'cp-header ' + (idx > 0 ? 'cp-separate_line' : '')}
        >
            <div class="header-left header-item">
                <h3 class="ilb-item">{columnName}</h3>
                <i class="ilb-item">({col_type})</i>
            </div>

            <div class="cp-vis header-item header-right">
                {#await spec}
                    Loading vis...
                {:then spec}
                    <VegaLite
                        {spec}
                        data={inputData}
                        options={{
                            actions: false,
                            renderer: 'svg',
                            height: 50
                        }}
                    />
                {:catch error}
                    <p>
                        ERROR producing visualization for {columnName} -- {error}
                    </p>
                {/await}
            </div>
        </div>

        <div slot="body" class="cp-body">
            <div class="cp-preview cp-section">
                <div>Data Preview</div>
                <div>
                    {#await headRows}
                        Getting Data...
                    {:then headRows}
                        <ul class="minimalList">
                            {#each headRows as row}
                                <li>{row}</li>
                            {/each}
                        </ul>
                    {:catch error}
                        <p>
                            ERROR getting head rows for {columnName} -- {error}
                        </p>
                    {/await}
                </div>
            </div>
            <div class="cp-meta cp-section">
                <div>MetaData</div>
                <div>
                    {#await colMd}
                        Getting column metadata...
                    {:then colMd}
                        <ul class="minimalList">
                            {#if col_type === 'int64' || col_type === 'float64'}
                                <li>Mean: {colMd?.mean}</li>
                                <li>Median: {colMd?.median}</li>
                                <li>Number Missing: {colMd?.num_invalid}</li>
                            {:else}
                                <li>Unique: {colMd?.num_unique}</li>
                                <li>Number Missing: {colMd?.num_invalid}</li>
                            {/if}
                        </ul>
                    {:catch error}
                        <p>
                            ERROR getting metadata for {columnName} -- {error}
                        </p>
                    {/await}
                </div>
            </div>
        </div>
    </CollapsibleCard>
</div>

<style>
    .column-profile {
        /* padding-top: 5px; */
        /* border-bottom: 1px dashed #e2e2e2; */
        width: 100%;
    }

    .cp-header {
        padding-left: 1em;
        min-height: 35px;
    }

    .cp-separate_line {
        border-top: 1px dashed #9e9e9e;
    }

    /* :global(.card.open) .cp-header {
        border-bottom: 1px dashed #9e9e9e;
    } */

    .cp-body {
        padding: 2em;
    }

    .cp-vis {
        height: 50px;
        width: 100%;
    }

    .cp-meta {
        margin-top: 1em;
    }

    .header-item {
        display: inline-block;
        /* text-align: center;
        position: relative;
        top: 50%;
        -ms-transform: translateY(-50%);
        -webkit-transform: translateY(-50%);
        transform: translateY(-50%); */
    }

    .ilb-item {
        display: inline-block;
    }

    .header-left {
        width: 100%;
    }

    .header-right {
        width: 100%;
    }

    ul.minimalList {
        list-style-type: none;
        padding-top: 0;
        padding-left: 0;
        margin: 0;
        overflow: hidden;
    }

    ul.minimalList li {
        float: left;
        display: block;
        text-align: center;
        padding: 16px;
        text-decoration: none;
        border: 1px solid #9e9e9e;
        border-radius: 5px;
        margin-right: 5px;
        margin-top: 5px;
    }
</style>
