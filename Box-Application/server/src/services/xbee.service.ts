import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, catchError, ignoreElements, filter, pluck, takeUntil, flatMap, merge } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, empty, timer } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';


export class XbeeService {

    public static xbee: any;

    public static GetNodeDiscovery(): void {
        
       
            // return XbeeService.xbee.localCommand({
            //     command: "AS"
            // }).pipe(map((response: any) => {
            //  return  response;
            // })).subscribe();
        var xbee_api = require("xbee-api");
        var xbee_api = require("xbee-api");


        // we want to ignore the command stream result as well as any error (for no
        // reply resulting from no found nodes)
        const nodeDiscoveryCommandStream = XbeeService.xbee.localCommand({ command: "AS" }).pipe(
            catchError(() => {
                const t = 2;

                return empty();
            }),
            ignoreElements()
        );

        const nodeDiscoveryRepliesStream = XbeeService.xbee.allPackets.pipe(
            filter((packet: any) => { 
                return packet.type === xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE && packet.command === "AS"; 
            }),
            pluck("nodeIdentification")
        );

        XbeeService.xbee
            .localCommand({
                command: "NT"
            })
            .pipe(
                flatMap((ntResult: any) => {
                    // Fulfill promise when NT expires
                    // NT is 1/10 seconds
                    var timeoutMs = ntResult.readInt16BE(0) * 100;
                    console.log("Got node discovery timeout:", timeoutMs, "ms");
                    return nodeDiscoveryRepliesStream.pipe(
                        takeUntil(timer(timeoutMs + 1000)),
                        merge(nodeDiscoveryCommandStream)
                    );
                })
            )
            .subscribe((nodeIdentification: any) => {
                console.log("Found node:\n", nodeIdentification);
            }, (e: any) => {
                console.log("Command failed:\n", e);
                XbeeService.xbee.close();
            },  () => {
                console.log("Timeout reached; done finding nodes");
                XbeeService.xbee.close();
            });
    }

    public static switchDigital(port: string, value: boolean, address: string): Observable<any> {
        return XbeeService.xbee.remoteCommand({
            command: port,
            commandParameter: [value ? 5 : 4],
            destination64: address// '0013a20040b971f3'
        }).pipe(map((response: any) => response));
    }

    public init(): Observable<void> {
        return this.initListners().pipe(
            map(() => XbeeService.xbee));
    }

    public initListners(): Observable<boolean> {
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
                        XbeeService.xbee = xbee;
                        console.log('* init Xbee OK.');

                        return true;
                    }, (err: any) => {
                        console.error(`! init Xbee KO ${err}`);

                        return false;
                    }));
            }
            console.warn(`  - Xbee port not found!`);

            return of(false);
        }));

        // return xbeeObs.pipe(
        //     map((xbee: any) => {
        //         XbeeService.xbee = xbee;
        //         console.log('* init Xbee OK.');
        //     }, (err: any) => {
        //         console.error(`! init Xbee KO ${err}`);

        //         return err;
        //     }));

        // return observableOf(true).pipe(
        //     map(() => {
        //         console.log('* init xbee OK');
        //         // var allPacketSub = XbeeService.xbee.allPackets
        //         //     .subscribe(function (packet) {
        //         //         console.log("Packet recieved:", packet);
        //         //     });
        //         // var monitorIODataSub = XbeeService.xbee
        //         //     .monitorIODataPackets()
        //         //     .subscribe(function (ioSamplePacket) {
        //         //         console.log("Analog sample from AD0:", ioSamplePacket.analogSamples.AD0);
        //         //     });
        //         // var monitorTransmissionsSub = XbeeService.xbee
        //         //     .monitorTransmissions()
        //         //     .subscribe(function (transmissionPacket) {
        //         //         // do something with the packet
        //         //         console.log("Recieved remote transmission:", transmissionPacket.data);
        //         //     });
        //     }));
    }
}
