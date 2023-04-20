import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { guidGenerator } from './guid';


interface LogEvent {
    eventname: string;
    timestamp: Date;
    details?: any;
}

interface AggregatedLog {
    totalDfToggles: number;
    totalColInteractions: number;
    uniqueWUpdatesDfs: number;
    uniqueWUpdatesCols: number;
    selectionExports: number;
    chartExports: number;
    summaryfactExports: number;
    totalDataUpdates: number;
    totalOpens: number;
    totalCloses: number;
    timeOpenPercent: number;
    startTime: Date;
    endTime: Date;
    sessionID: string;
    sessionIdx: number;
}

// minutes * (seconds * milliseconds)
const LOG_INTERVAL = 10 * (60 * 1000)
// const LOG_INTERVAL = (10 * 1000)

/**
 * Keeps track of cumulative logs across a session. 
 * A session starts when the extension is loaded or browser is refreshed.
 */
export class Logger {
    // tracking vars
    private _logs: LogEvent[] = []
    private _lastOpenedStatus: "open" | "closed";
    private _lastLoggedTime: Date;
    private sessionStartTime: Date;
    private sessionID: string
    private sessionIdx: number = 0
    private colCache = new Map<string, Set<string>>()

    // cumulative stats
    private totalDfToggles = 0
    private totalColInteractions = 0
    private numDfsWUpdate = 0
    private numColsWUpdate = 0
    private selectionExports = 0
    private chartExports = 0
    private summaryfactExports = 0
    private totalDataUpdates = 0
    private totalOpens = 0
    private totalCloses = 0
    private timeOpen = 0

    constructor() {
        this._logs = []
        this._lastOpenedStatus = "closed"
        this._lastLoggedTime = new Date()
        this.sessionID = guidGenerator() // regenerated when extension reloads on page refresh or new tab
        this.sessionStartTime = new Date()
        setInterval(() => {
            this.save()
        }, LOG_INTERVAL)
    }

    public log(eventname: string, details?: any) {
        let e: LogEvent = { eventname, timestamp: new Date(), details }
        this._logs.push(e)
    }

    /**
     * Print logs for debugging
     */
    public printAllLogs() {
        console.log("All Logs:", this._logs)
    }

    /**
     * Main funtion to save called at intervals
     */
    private save() {
        let currentTime = new Date()
        const l = this.aggregateLogs(currentTime)
        this.write(l).then((status) => {
            if (status === "success") {
                this._logs = []
                this._lastLoggedTime = currentTime
                this.sessionIdx += 1
            }
        })
    }

    /**
     * Iterate over logs and count number of unique df interactions and column interactions,
     * Aggregate total number of exports as well
     */
    private aggregateLogs(endTime: Date): AggregatedLog {
        let lastToggleTime = this._lastLoggedTime

        this._logs.forEach((log: LogEvent) => {
            if ((log.eventname === "ToggleDFOpen") || (log.eventname === "ToggleDFClose")) {
                if (!this.colCache.has(log.details.dfName)) {
                    this.numDfsWUpdate += 1
                    let s = new Set<string>()
                    this.colCache.set(log.details.dfName, s)
                }
                this.totalDfToggles += 1
            } else if (log.eventname === "ColumnToggleOpen" || log.eventname === "ColumnToggleClose" || log.eventname === "ColumnHover") {
                if (this.colCache.has(log.details.dfName)) {
                    let cache = this.colCache.get(log.details.dfName)
                    if (!cache.has(log.details.colName)) {
                        this.numColsWUpdate += 1
                        cache.add(log.details.colName)
                    }
                } else {
                    let uniqueCols = new Set<string>()
                    uniqueCols.add(log.details.colName)
                    this.colCache.set(log.details.dfName, uniqueCols)
                    this.numColsWUpdate += 1
                    this.numDfsWUpdate += 1
                }
                this.totalColInteractions += 1
            } else if (log.eventname === "export") {
                if (log.details?.exportType === "selection") {
                    this.selectionExports += 1
                } else if (log.details?.exportType === "chart") {
                    this.chartExports += 1
                } else if (log.details?.exportType === "summaryfact") {
                    this.summaryfactExports += 1
                }
            } else if (log.eventname === "AutoProfiler.toggleOpen") {
                this.totalOpens += 1
                this._lastOpenedStatus = "open"
                lastToggleTime = log.timestamp
            } else if (log.eventname === "AutoProfiler.toggleClosed") {
                this.totalCloses += 1
                let delta = log.timestamp.getTime() - lastToggleTime.getTime()
                this.timeOpen += delta

                this._lastOpenedStatus = "closed"
                lastToggleTime = log.timestamp
            } else if (log.eventname === "AutoProfiler.updateData") {
                this.totalDataUpdates += 1
                this.colCache.delete(log.details?.dfName)
            }
        })

        // if the last event was an open, we need to add the time since the last event to the open time
        let finalDelta = endTime.getTime() - lastToggleTime.getTime()
        if (this._lastOpenedStatus === "open") {
            this.timeOpen += finalDelta
        }

        const totalTimeInterval = endTime.getTime() - this.sessionStartTime.getTime()
        let timeOpenPercent = (this.timeOpen / totalTimeInterval) * 100

        return {
            totalDfToggles: this.totalDfToggles,
            totalColInteractions: this.totalColInteractions,
            uniqueWUpdatesDfs: this.numDfsWUpdate,
            uniqueWUpdatesCols: this.numColsWUpdate,
            selectionExports: this.selectionExports,
            chartExports: this.chartExports,
            summaryfactExports: this.summaryfactExports,
            totalDataUpdates: this.totalDataUpdates,
            totalOpens: this.totalOpens,
            totalCloses: this.totalCloses,
            timeOpenPercent,
            startTime: this.sessionStartTime,
            endTime,
            sessionID: this.sessionID,
            sessionIdx: this.sessionIdx
        }

    }

    /**
     * Write logs to server route autoprofiler/savelogs
     * @param aggregatedLogs logs to be written
     */
    private async write(aggregatedLog: AggregatedLog): Promise<"success" | "fail"> {
        try {
            const settings = ServerConnection.makeSettings();
            const url = URLExt.join(settings.baseUrl, 'autoprofiler/savelogs');

            const response = await ServerConnection.makeRequest(url, {
                body: JSON.stringify({ "logs": aggregatedLog }),
                method: 'POST',
            }, settings);

            // if response is ok return success, else fail
            if (response.ok) {
                return "success"
            }
        } catch (error) {
        }

        return "fail"
    }
}