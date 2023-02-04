import _ from 'lodash';

import type { IHistogram, TimeBin } from '../../common/exchangeInterfaces';

export function convertToTimeBin(histogram: IHistogram): TimeBin[] {
    if (_.isUndefined(histogram)) return [];

    return histogram.map(b => ({
        count: b.count,
        ts_start: new Date(b.low * 1000),
        ts_end: new Date(b.high * 1000)
    }));
}