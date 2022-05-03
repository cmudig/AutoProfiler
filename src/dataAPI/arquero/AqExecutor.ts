export {};
// import * as aq from 'arquero';

// export class ArqueroExecutor { // implements Executor

//     _data;

//     constructor(data) {
//         this._data = data
//     }

//     getShape(): number[] {
//         /* returns tuple of (num_rows, num_columns) */
//         return [this._data.numRows(), this._data.numCols()]
//     }

//     getColumn(colName: string) {
//         return this._data.column(colName)
//     }

//     getColumns() {
//         return this._data.columnNames()
//     }

//     getColumnTypes() {
//         const cols = this.getColumns()

//         let typeInfo = cols.reduce((map, key) => {
//             map[key] = typeof this.getColumn(key).get(0)
//             return map
//         }, {})

//         return typeInfo
//     }

//     getHead(n: number = 5) {
//         return this._data.slice(0, n)
//     }

//     getNomColVisData(colName: string, n: number = 5) {
//         // aggregate column by count and then filter to top 10

//         return this._data.groupby(colName).count().orderby(colName).slice(0, n)
//     }

//     getQuantBinnedData(colName: string, maxbins: number = 10) {
//         // compute a bin transform over the data and impute empty bins as 0
//         let binned_data = this._data.groupby({
//             bin_0: aq.bin(colName, { maxbins: maxbins }),
//             bin_1: aq.bin(colName, { maxbins: maxbins, offset: 1 })
//         }).count(
//         ).impute(
//             { count: () => 0 }, // set imputed counts to zero
//             { expand: { bin_0: d => aq.op.sequence(...aq.op.bins(d.bin_0)), } }
//         ).orderby('bin_0').reify()

//         let bin_size = Math.abs(binned_data.column("bin_0").get(1) - binned_data.column("bin_0").get(0))

//         binned_data = binned_data.params({ bin_size }).derive({ bin_1: (d, $) => d.bin_0 + $.bin_size })

//         return { binned_data, bin_size }
//     }

//     getNomMeta(colName: string) {
//         return this._data.params({ colName }).rollup({
//             num_unique: (d, $) => aq.op.distinct(d[$.colName]),
//             num_invalid: (d, $) => aq.op.invalid(d[$.colName]),
//         }).objects()[0]
//     }

//     getQuantMeta(colName: string) {
//         return this._data.params({ colName }).rollup({
//             mean: (d, $) => aq.op.mean(d[$.colName]),
//             median: (d, $) => aq.op.median(d[$.colName]),
//             num_invalid: (d, $) => aq.op.invalid(d[$.colName]),
//         }).objects()[0]
//     }

// }
