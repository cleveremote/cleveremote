import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { multibar } from '../common/progress.bar';
const _colors = require('colors');

export class Tools {
    public static serialNumber: string;
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
        console.log('\x1b[36m', message, '\x1b[0m');
    }

    public static logError(message: string, err?: any): boolean {
        console.log('\x1b[31m', message, '\x1b[0m');
        return false;
    }

    public static logWarn(message: string): void {
        console.log('\x1b[33m', message, '\x1b[0m');
    }

    public static logSuccess(message: string): boolean {
        console.log('\x1b[32m', message, '\x1b[0m');
        return true;
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

    public static startProgress(service: string, start: number, end: number): any {

        const progressBar = multibar.create(end, start, {});
        let cloneOption = {} as any;
        cloneOption = Object.assign(cloneOption, (multibar as any).options);
        cloneOption.format = _colors.green(service + ' progress     ') + '|' + _colors.green('{bar}') + '| {percentage}%' + '\n';
        (progressBar as any).options = cloneOption;
        return progressBar;
    }

    public static stopProgress(service?: string, progressBar?: any, error?: any): any {
        if (error) {
            let cloneOption = {} as any;
            cloneOption = Object.assign(cloneOption, (multibar as any).options);
            cloneOption.format = _colors.red(service + ' progress     ') + '|' + _colors.red('{bar}') + '| {percentage}%' + '\n';
            progressBar.options = cloneOption;
            multibar.stop();
            Tools.logError(error);
        } else {
            multibar.stop();
        }
    }

}
