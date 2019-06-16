import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';

export class XbeeService {

    public static xbee: any;

    public static GetNodeDiscovery(): Observable<any> {
        return XbeeService.xbee.localCommand({
            command: "ND"
        }).pipe(map((response: any) => response));
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

    public initListners(): Observable<void> {
        const exists = portName => SerialPort.list().then(ports => ports.some(port => port.comName === portName));
        const xbeeObs = Observable.create(observer => {
            let xbee: any;
            try {
                xbee = xbeeRx({
                    serialport: '/dev/ttyUSB0',
                    api_mode: 2,
                    defaultTimeoutMs: 5000 * 10,
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

        return from(exists('/dev/ttyUSB0')).pipe(map((isOk: any) => {
            if (isOk) {
                return xbeeObs.pipe(
                    map((xbee: any) => {
                        XbeeService.xbee = xbee;
                        console.log('* init Xbee OK.');
                    }, (err: any) => {
                        console.error(`! init Xbee KO ${err}`);

                        return err;
                    }));
            }
            console.warn(`  - Xbee port not found!`);
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
