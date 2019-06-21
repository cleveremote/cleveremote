import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";

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

    public static loginfo(message: string): void {
        console.log('\x1b[36m', message, '\x1b[0m');
    }

    public static logError(message: string, err?: any): void {
        console.log('\x1b[31m', message, '\x1b[0m');
    }

    public static logWarn(message: string): void {
        console.log('\x1b[33m', message, '\x1b[0m');
    }

    public static logSuccess(message: string): void {
        console.log('\x1b[32m', message, '\x1b[0m');
    }

    public static getSerialNumber(): Observable<void> {
        Tools.loginfo(`* get box serial number`);
        // tslint:disable-next-line: no-require-imports
        const util = require('util');

        // tslint:disable-next-line: no-require-imports
        return from(util.promisify(require('child_process').exec)('cat /proc/cpuinfo | grep ^Serial | cut -d":" -f2')).pipe(
            map((x: any) => {
                const { stdout, stderr } = x;
                if (stdout) {
                    Tools.serialNumber = stdout.replace(/(\r\n|\n|\r|\s)/gm, "");
                    Tools.logSuccess(`  => OK. :${Tools.serialNumber}`);
                } else {
                    Tools.logSuccess(`  => KO. :${stderr}`);
                }



            })
        );
    }

}
