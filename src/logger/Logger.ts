import type { ProfileModel } from "../dataAPI/ProfileModel";

interface LogEvent {
    eventname: string;
    timestamp: Date;
    details?: any;
}

export class Logger {
    private _profileModel: ProfileModel;
    private _logs: LogEvent[] = []
    constructor(pm: ProfileModel) {
        this._logs = []
        this._profileModel = pm

        // save logs every 5 seconds
        setInterval(() => {
            this.save()
        }, 5000)
    }

    log(eventname: string, details?: any) {
        this._logs.push({ eventname, timestamp: new Date(), details })
    }

    printAllLogs() {
        console.log("All Logs:", this._logs)
    }

    save() {
        if (this._profileModel.notebook) {
            this._profileModel.notebook.saveToNotebookMetadata("AutoProfilerLogs", this._logs)
        } else {
            console.log("Not connected to notebook, not saving logs")
        }
        this.printAllLogs()
    }
}
