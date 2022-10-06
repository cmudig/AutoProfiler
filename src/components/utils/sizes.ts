import { format } from 'd3-format';
// stuff for figuring out what to do with which view?

export const config = {
    // width of summary value
    // width of null %
    nullPercentageWidth: 75,
    mediumCutoff: 300,
    compactBreakpoint: 370,
    largeBreakpoint: 500,
    hideRight: 325,
    summaryVizWidth: { default: 120, large: 240 },
    exampleWidth: { medium: 204, small: 132 }
};

export const percentage = format('.1%');

export function getSummarySize(containerWidth: number): number {
    if (containerWidth > config.largeBreakpoint) {
        return config.summaryVizWidth.large;
    }

    return config.summaryVizWidth.default;
}
