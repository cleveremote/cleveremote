import { XbeeService } from "../../services/xbee.service";
import { forwardRef, Inject } from "@nestjs/common";
import { map, tap, mergeMap, catchError, ignoreElements, filter, pluck, takeUntil, flatMap, merge, retryWhen } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, empty, timer } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { genericRetryStrategy } from "../../services/tools/generic-retry-strategy";
import { Tools } from "../../services/tools-service";
import * as cliProgress from 'cli-progress';
import { multibar } from "../../common/progress.bar";
const _colors = require('colors');
export class DeviceService {
    public xbee;

    public progressBar;



    public executeRemoteCommand(timeout: number, cmd: string, address: string | ArrayBuffer, params?: Array<number> | string, option?: number): Observable<any> {
        const localCommandObj = { command: cmd, destination64: address, timeoutMs: timeout, options: option } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }
        console.log('Commande log', cmd);

        return of(true)
            .pipe(mergeMap((res: boolean) => this.xbee.remoteCommand(localCommandObj)
                .pipe(map((response: any) => {
                    if (response.commandStatus === 0) {
                        console.log('success', response);
                        return response;
                    }
                    console.log('error response', response);
                    throw { response };
                }))
            ),
                catchError((e: any) => {
                    console.log('error catch');
                    throw { e };
                }),
                retryWhen(genericRetryStrategy({ durationBeforeRetry: 1, maxRetryAttempts: 100 }))
            );
    }

    public executeLocalCommand(cmd: string, params?: Array<number> | string): Observable<any> {
        const localCommandObj = { command: cmd } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }
        return this.xbee.localCommand(localCommandObj).pipe(map((response: any) => response));
    }

    public configuretransceiver(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...

        return {};
    }

    public init(): Observable<boolean> {
        Tools.loginfoProgress('* Start micro-service : XBEE...');
        this.progressBar = multibar.create(1, 0);
        let cloneOption = {} as any;
        cloneOption = Object.assign(cloneOption, multibar.options);
        cloneOption.format = _colors.green('XBEE progress      ')+'|' + _colors.green('{bar}') + '| {percentage}%'+'\n';
        this.progressBar.options = cloneOption;

        const exists = portName => SerialPort.list().then(ports => ports.some(port => port.comName === portName));
        const xbeeObs = new Observable<any>(observer => {
            let xbee: any;
            try {
                xbee = xbeeRx({
                    // serialport: '/dev/ttyUSB0',
                    serialport: 'COM6',
                    serialPortOptions: {
                        baudRate: 9600
                    },
                    module: "ZigBee"
                });
            } catch (err) {
                observer.error(err);
            }

            observer.next(xbee);
        });

        //  return of(exists('/dev/ttyUSB0')).pipe(map((isOk: any) => {
        return of(exists('COM6')).pipe(mergeMap((isOk: boolean) => {
            if (isOk) {
                return xbeeObs.pipe(
                    map((xbee: any) => {
                        this.xbee = xbee;
                        this.progressBar.increment();
                        return true;
                    }, (err: any) => {
                        Tools.logError(`  => Xbee initilization failed ${err}`);
                        return false;
                    }));
            }
            Tools.logWarn(`  => Xbee port not found!`);
            return of(false);
        }))
        .pipe(catchError((response) => {
            let cloneOption = {} as any;
            cloneOption = Object.assign(cloneOption, multibar.options);
            cloneOption.format = _colors.red('XBEE progress      ')+'|' + _colors.red('{bar}') + '| {percentage}%'+'\n';
            this.progressBar.options = cloneOption;
            multibar.stop();
            Tools.logError(response);
            return of(false);
        }));;
    }



}
