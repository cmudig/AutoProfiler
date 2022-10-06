export interface DomainCoordinates {
    x: number; //| Date;
    y: number; //| Date;
}

export const DEFAULT_COORDINATES: DomainCoordinates = {
    x: undefined,
    y: undefined
};

export interface PlotConfig {
    top: number;
    bottom: number;
    left: number;
    right: number;
    buffer: number;
    width: number;
    height: number;
    devicePixelRatio: number;
    plotTop: number;
    plotBottom: number;
    plotLeft: number;
    plotRight: number;
    fontSize: number;
    textGap: number;
    id: any;
}
