export const config = {
    nullPercentageWidth: 75,
    mediumCutoff: 300,
    compactBreakpoint: 350,
    largeBreakpoint: 500,
    summaryVizWidth: { default: 120, large: 240 },
    exampleWidth: { medium: 204, small: 132 }
};


export function getSummarySize(containerWidth: number): number {
    if (containerWidth > config.largeBreakpoint) {
        return config.summaryVizWidth.large;
    }

    return config.summaryVizWidth.default;
}
