import * as aq from 'arquero';


// Types
type ExecutorType = "pandas" | "arquero"

// executor interface for ArqueroExecutor below
interface Executor {
    getShape(): number[],
    getColumn(column_name: string): any,
    getColumns(): string[], // TODO rename to column names
    getColumnTypes(): { [column_name: string]: string },
    getHead(n: number): any,
    getNomColVisData(column_name: string, n: number): any,
    getQuantBinnedData(column_name: string, maxbins: number): { binned_data: any, bin_size: number },
    getNomMeta(column_name: string): any,
    getQuantMeta(column_name: string): any,
}

// same as ArqueroExecutor but with Pandas commands for jupyterlab
class PandasExecutor implements Executor {
    _data;

    constructor(data) {
    }

    getShape(): number[] {
        /* returns tuple of (num_rows, num_columns) */
    }

    getColumn(column_name: string) {
    }

    getColumns(): string[] {

    } 
    getColumnTypes(): { [column_name: string]: string } {

    }
    getHead(n: number): any {

    }
    getNomColVisData(column_name: string, n: number): any {

    }
    getQuantBinnedData(column_name: string, maxbins: number): { binned_data: any, bin_size: number } {

    }
    getNomMeta(column_name: string): any {

    }
    getQuantMeta(column_name: string): any {

    }

}

export default class ArqueroExecutor implements Executor {

    _data;

    constructor(data) {
        this._data = data
    }

    getShape(): number[] {
        /* returns tuple of (num_rows, num_columns) */
        return [this._data.numRows(), this._data.numCols()]
    }

    getColumn(column_name: string) {
        return this._data.column(column_name)
    }

    getColumns() {
        return this._data.columnNames()
    }

    getColumnTypes() {
        const cols = this.getColumns()

        let typeInfo = cols.reduce((map, key) => {
            map[key] = typeof this.getColumn(key).get(0)
            return map
        }, {})

        return typeInfo
    }

    getHead(n: number = 5) {
        return this._data.slice(0, n)
    }

    getNomColVisData(column_name: string, n: number = 5) {
        // aggregate column by count and then filter to top 10

        return this._data.groupby(column_name).count().orderby(column_name).slice(0, n)
    }

    getQuantBinnedData(column_name: string, maxbins: number = 10) {
        // compute a bin transform over the data and impute empty bins as 0
        let binned_data = this._data.groupby({
            bin_0: aq.bin(column_name, { maxbins: maxbins }),
            bin_1: aq.bin(column_name, { maxbins: maxbins, offset: 1 })
        }).count(
        ).impute(
            { count: () => 0 }, // set imputed counts to zero
            { expand: { bin_0: d => aq.op.sequence(...aq.op.bins(d.bin_0)), } }
        ).orderby('bin_0').reify()

        let bin_size = Math.abs(binned_data.column("bin_0").get(1) - binned_data.column("bin_0").get(0))

        binned_data = binned_data.params({ bin_size }).derive({ bin_1: (d, $) => d.bin_0 + $.bin_size })

        return { binned_data, bin_size }
    }

    getNomMeta(column_name: string) {
        return this._data.params({column_name}).rollup({
            num_unique: (d, $) => aq.op.distinct(d[$.column_name]),
            num_invalid: (d, $) => aq.op.invalid(d[$.column_name]),
        }).objects()[0]
    } 

    getQuantMeta(column_name: string) {
        return this._data.params({column_name}).rollup({
            mean: (d, $) => aq.op.mean(d[$.column_name]),
            median: (d, $) => aq.op.median(d[$.column_name]),
            num_invalid: (d, $) => aq.op.invalid(d[$.column_name]),
        }).objects()[0]
    } 

}