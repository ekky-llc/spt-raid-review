import config from '../../config.json';
import { DeleteFile, WriteLineToFile } from '../Controllers/FileSystem/DataSaver';
import { ReadFolderContents } from '../Controllers/FileSystem/FileReader';

/**
 * Abstraction for `console.log`, so that we can switch logging libraries in the future
 * Also allows us to dump to log files for support purposes.
 */
export class Logger {
    private logfilename: string;

    constructor() {
        this.logfilename = null;
    }

    /**
     * Creats a new log file, and purges old ones.
     * - Called when the server is started. (See 'mod.ts')
     * - Called if the server is active, and the last raid finishes, or is timed out (See 'sessionManager.ts').
     */
    public init() : void {
        if (config.enableLogFiles) {
            const existingLogs = ReadFolderContents('logging', '', '', false);
            if (existingLogs.length > config.maximumLogFiles) {
                existingLogs.sort((a, b) => {
                    // Expects filenames to be <utc-milliseconds>_raid_review.log
                    return parseInt(a.split('_')[0]) - parseInt(b.split('_')[0]);
                });
                DeleteFile('logs', '', '', existingLogs[0])
            }
            this.logfilename = `${new Date().getTime()}_raid_review.log`;
            this.log(`New log file created for session '${this.logfilename}', this can be found in the '/logs' directory of the mod folder.`)
        }
    }


    public log(str: string): void {
        console.log(`[RAID-REVIEW] ${str}`);

        this.appendToLogFile(str);
    }


    public debug(str: string): void {
        if (config.enableDebugLogs) {
            console.debug(`[RAID-REVIEW] ${str}`);
        }

        this.appendToLogFile(str);
    }


    public warn(str: string): void {
        console.warn(`[RAID-REVIEW] ${str}`);

        this.appendToLogFile(str);
    }
    

    public error(str: string, dump: any = null): void {
        console.error(`[RAID-REVIEW] ${str}`);

        if (str || dump) {
            console.error(`[RAID-REVIEW:DUMP] ${dump}`);
        }
    }


    private appendToLogFile(str: string): void {
        const dateTime = new Date().toISOString();
        const logMessage = `${dateTime} - ${str}\n`;

        WriteLineToFile(this, 'logs', '', '', this.logfilename , dateTime, logMessage);
    }
}
