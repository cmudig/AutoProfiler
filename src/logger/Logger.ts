import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { guidGenerator } from './guid';


interface LogEvent {
    eventname: string;
    timestamp: Date;
    details?: any;
}

interface AggregatedLog {
    uniqueDfs: number;
    uniqueCols: number;
    reexaminedDfs: number;
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

// Log every 5 min
// minutes * (seconds * milliseconds)
const LOG_INTERVAL = 5 * (60 * 1000)

export class Logger {
    private _logs: LogEvent[] = []
    private _lastOpenedStatus: "open" | "closed";
    private _lastLoggedTime: Date;
    private sessionID: string
    private sessionIdx: number = 0
    constructor() {
        this._logs = []
        this._lastOpenedStatus = "closed"
        this._lastLoggedTime = new Date()
        this.sessionID = guidGenerator() // regenerated when extension reloads on page refresh or new tab
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
        // statistics
        let uniqueDfs = new Set()
        let uniqueCols = new Set()
        let selectionExports = 0
        let chartExports = 0
        let summaryfactExports = 0
        let totalDataUpdates = 0
        let totalOpens = 0
        let totalCloses = 0
        let totalTimeInterval = endTime.getTime() - this._lastLoggedTime.getTime()
        let timeOpen = 0
        let lastToggleTime = this._lastLoggedTime

        // reexaimned dfs for when looked at a dataframe after an update
        let updatedDfs = new Set()
        let reexaminedDfs = 0

        this._logs.forEach((log: LogEvent) => {
            if ((log.eventname === "ToggleDFOpen") || (log.eventname === "ToggleDFClose")) {
                if (updatedDfs.has(log.details.dfName)) {
                    reexaminedDfs += 1
                    updatedDfs.delete(log.details.dfName) // delete updated dfs after looked at again
                }
                uniqueDfs.add(log.details.dfName)
            } else if (log.eventname === "ColumnToggleOpen" || log.eventname === "ColumnToggleClose" || log.eventname === "ColumnHover") {
                if (updatedDfs.has(log.details.dfName)) {
                    reexaminedDfs += 1
                    updatedDfs.delete(log.details.dfName)
                }
                uniqueDfs.add(log.details?.dfName)
                uniqueCols.add(`${log.details?.dfName}.${log.details?.colName}`)
            } else if (log.eventname === "export") {
                if (log.details?.exportType === "selection") {
                    selectionExports += 1
                } else if (log.details?.exportType === "chart") {
                    chartExports += 1
                } else if (log.details?.exportType === "summaryfact") {
                    summaryfactExports += 1
                }
            } else if (log.eventname === "AutoProfiler.toggleOpen") {
                totalOpens += 1

                this._lastOpenedStatus = "open"
                lastToggleTime = log.timestamp
            } else if (log.eventname === "AutoProfiler.toggleClosed") {
                totalCloses += 1
                let delta = log.timestamp.getTime() - lastToggleTime.getTime()
                timeOpen += delta

                this._lastOpenedStatus = "closed"
                lastToggleTime = log.timestamp
            } else if (log.eventname === "AutoProfiler.updateData") {
                totalDataUpdates += 1
                updatedDfs.add(log.details?.dfName)
            }
        })

        // if the last event was an open, we need to add the time since the last event to the open time
        let finalDelta = endTime.getTime() - lastToggleTime.getTime()
        if (this._lastOpenedStatus === "open") {
            timeOpen += finalDelta
        }

        let timeOpenPercent = (timeOpen / totalTimeInterval) * 100

        return {
            uniqueDfs: uniqueDfs.size,
            uniqueCols: uniqueCols.size,
            reexaminedDfs,
            selectionExports,
            chartExports,
            summaryfactExports,
            totalDataUpdates,
            totalOpens,
            totalCloses,
            timeOpenPercent,
            startTime: this._lastLoggedTime,
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