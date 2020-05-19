import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";

import * as cliProgress from 'cli-progress';
import * as _colors from 'colors';




export const boxInfo = { id: undefined, liveReload: false, isConnected: false };
export class Tools {
    public static serialNumber: string;
    public static debug = true;
    public static titleApplication(): void {
        // tslint:disable
        console.log('\x1b[34m', "                                                                                                                                               ", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                                               ", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                                               ", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                                               ", '\x1b[0m');
        console.log('\x1b[34m', " █████╗  ██████╗  ██████╗ ██████╗ ███████╗ ██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ ", '\x1b[0m');
        console.log('\x1b[34m', "██╔══██╗██╔════╝ ██╔════╝ ██╔══██╗██╔════╝██╔════╝ ██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗", '\x1b[0m');
        console.log('\x1b[34m', "███████║██║  ███╗██║  ███╗██████╔╝█████╗  ██║  ███╗███████║   ██║   ██║██║   ██║██╔██╗ ██║    ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝", '\x1b[0m');
        console.log('\x1b[34m', "██╔══██║██║   ██║██║   ██║██╔══██╗██╔══╝  ██║   ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║    ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗", '\x1b[0m');
        console.log('\x1b[34m', "██║  ██║╚██████╔╝╚██████╔╝██║  ██║███████╗╚██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║    ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║", '\x1b[0m');
        console.log('\x1b[34m', "╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                                               ", '\x1b[0m');

        console.log('\x1b[34m', "                                                                                                                          ", '\x1b[0m');
        console.log('\x1b[34m', "        █████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗", '\x1b[0m');
        console.log('\x1b[34m', "        ╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                          ", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                          ", '\x1b[0m');
        // tslint:enable
    }

    public static titleStarted(started: boolean): void {
        // tslint:disable
        console.log('\x1b[34m', "                                                                                                                          ", '\x1b[0m');
        console.log('\x1b[34m', "                                                                                                                          ", '\x1b[0m');
        console.log('\x1b[34m', "        █████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗█████╗", '\x1b[0m');
        console.log('\x1b[34m', "        ╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝╚════╝", '\x1b[0m');
        if (started) {
            console.log('\x1b[32m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[32m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[32m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[32m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[32m', "                                   ███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗      ██████╗ ██╗  ██╗", '\x1b[0m');
            console.log('\x1b[32m', "                                   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗    ██╔═══██╗██║ ██╔╝", '\x1b[0m');
            console.log('\x1b[32m', "                                   ███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██║  ██║    ██║   ██║█████╔╝ ", '\x1b[0m');
            console.log('\x1b[32m', "                                   ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██║  ██║    ██║   ██║██╔═██╗ ", '\x1b[0m');
            console.log('\x1b[32m', "                                   ███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██████╔╝    ╚██████╔╝██║  ██╗", '\x1b[0m');
            console.log('\x1b[32m', "                                   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝      ╚═════╝ ╚═╝  ╚═╝", '\x1b[0m');
            console.log('\x1b[32m', "                                                                               ", '\x1b[0m');
        } else {
            console.log('\x1b[36m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[36m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[36m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[36m', "                                                                               ", '\x1b[0m');
            console.log('\x1b[31m', "                                   ███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗     ██╗  ██╗ ██████╗ ", '\x1b[0m');
            console.log('\x1b[31m', "                                   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗    ██║ ██╔╝██╔═══██╗", '\x1b[0m');
            console.log('\x1b[31m', "                                   ███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██║  ██║    █████╔╝ ██║   ██║", '\x1b[0m');
            console.log('\x1b[31m', "                                   ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██║  ██║    ██╔═██╗ ██║   ██║", '\x1b[0m');
            console.log('\x1b[31m', "                                   ███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██████╔╝    ██║  ██╗╚██████╔╝", '\x1b[0m');
            console.log('\x1b[31m', "                                   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝     ╚═╝  ╚═╝ ╚═════╝ ", '\x1b[0m');
            console.log('\x1b[31m', "                                                                               ", '\x1b[0m');
            // tslint:enable
        }
    }

    public static loginfoProgress(message: string): void {
        process.stdout.write('\x1b[36m' + message + '\x1b[0m');
    }


    public static loginfo(message: string): void {
        if (Tools.debug) {
            console.log('\x1b[36m', `${message} executed At ${Date()}`, '\x1b[0m');
        }
    }

    public static logError(message: string, err?: any): void {
        if (Tools.debug) {
            console.log('\x1b[31m', `${message} executed At ${Date()}`, JSON.stringify(err), '\x1b[0m');
        }
    }

    public static logWarn(message: string): void {
        if (Tools.debug) {
            console.log('\x1b[33m', `${message} executed At ${Date()}`, '\x1b[0m');
        }
    }

    public static logSuccess(message: string): void {
        if (Tools.debug) {
            console.log('\x1b[32m', `${message} executed At ${Date()}`, '\x1b[0m');
        }
    }

    public static getSerialNumber(): Observable<string> {
        // Tools.loginfo(`* get box serial number`);
        // const util = require('util');
        // return from(util.promisify(require('child_process').exec)('cat /proc/cpuinfo | grep ^Serial | cut -d":" -f2')).pipe(
        //     map((x: any) => {
        //         const { stdout, stderr } = x;
        //         if (stdout) {
        //             Tools.serialNumber = stdout.replace(/(\r\n|\n|\r|\s)/gm, "");
        //             Tools.logSuccess(`  => OK. :${Tools.serialNumber}`);
        //             return Tools.serialNumber;
        //         }
        //         Tools.logSuccess(`  => KO. :${stderr}`);
        //         return undefined;
        //     })
        // );
        Tools.serialNumber = '123456789';
        return of(Tools.serialNumber);
    }

    // public static startProgress(service: string, start: number, end: number): any {

    //     const progressBar = multibar.create(end, start, {});
    //     let cloneOption = {} as any;
    //     cloneOption = Object.assign(cloneOption, (multibar as any).options);
    //     cloneOption.format = _colors.green(service) + '|' + _colors.green('{bar}') + '| {percentage}%' + '\n';
    //     (progressBar as any).options = cloneOption;
    //     return progressBar;
    // }

    // public static stopProgress(service?: string, progressBar?: any, error?: any): any {
    //     if (error) {
    //         let cloneOption = {} as any;
    //         cloneOption = Object.assign(cloneOption, (multibar as any).options);
    //         cloneOption.format = _colors.red(service) + '|' + _colors.red('{bar}') + '| {percentage}%' + '\n';
    //         progressBar.options = cloneOption;
    //         multibar.stop();
    //         Tools.logError(error);
    //     } else {
    //         multibar.stop();
    //     }
    // }


    public static startProgress(service: string, start: number, end: number, title?: string): any {
        if (title) {
            console.log('\x1b[36m', `${title} executed At ${Date()}`, '\x1b[0m');
        }

        const progressBar = new cliProgress.SingleBar({
            format: 'CLI Progress |' + _colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        progressBar.start(end, start)
        let cloneOption = {} as any;
        cloneOption = Object.assign(cloneOption, (progressBar as any).options);
        cloneOption.format = _colors.green(service) + '|' + _colors.cyan('{bar}') + '| {percentage}%';
        (progressBar as any).options = cloneOption;
        return progressBar;
    }

    public static stopProgress(service?: string, progressBar?: any, error?: any): any {
        if (error) {
            let cloneOption = {} as any;
            cloneOption = Object.assign(cloneOption, (progressBar as any).options);
            cloneOption.format = _colors.red(service) + '|' + _colors.red('{bar}') + '| {percentage}%' + '\n';
            progressBar.options = cloneOption;
            progressBar.stop();
            Tools.debug = true;
            Tools.logError('Failed', error);
        } else {
            progressBar.stop();
        }
    }

    public static groupBy(array, f) {
        var groups = {};
        array.forEach(function (o) {
            var group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return groups[group];
        });
    }

    public static onlyDistinctValue(list: Array<any>, attribute: string): Array<any> {
        var resArr = [];
        list.filter(function (item) {
            var i = resArr.findIndex(x => x[attribute] === item[attribute]);
            if (i <= -1) {
                resArr.push(item);
            }
            return null;
        });
        return resArr;
    }

}
