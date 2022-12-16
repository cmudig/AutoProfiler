import type { ProfileModel } from "../dataAPI/ProfileModel";
import { allowLogs } from "../stores";
import { get } from "svelte/store";

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
        const allowSave = get(allowLogs)
        if (this._profileModel.notebook && allowSave) {
            this._profileModel.notebook.saveToNotebookMetadata("AutoProfilerLogs", this._logs)
        }
    }
}
