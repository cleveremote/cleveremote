import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, catchError, ignoreElements, filter, pluck, takeUntil, flatMap, merge } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, empty, timer } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';


export class XbeeService {

    public static xbee: any;


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
            // }));
        })).pipe(
            map(() => {

                // //const val = "02 00 02 00 02 3412000000000000 7D49C04000A21300 BE21 35020F01 3412000000000000 F371B94000A21300 EA9D35020FF9";
                // //const val = "3412000000000000";
                // //const val = "7D49C04000A21300";
                // //const val = "BE21";
                // const val = "3502";
                // //"0F01"

                // const changeEndianness = (string) => {
                //     const result = [];
                //     let len = string.length - 2;
                //     while (len >= 0) {
                //         result.push(string.substr(len, 2));
                //         len -= 2;
                //     }
                //     return result.join('');
                // }

                // changeEndianness(val); /// '3412FF00AA'


                // console.log('* init xbee OK');
                // var allPacketSub = XbeeService.xbee.allPackets
                //     .subscribe(function (packet, response) {
                //         console.log("Packet recieved:", packet);
                //     });
                // // var monitorIODataSub = XbeeService.xbee
                // //     .monitorIODataPackets()
                // //     .subscribe(function (ioSamplePacket) {
                // //         console.log("Analog sample from AD1:", ioSamplePacket.analogSamples.AD1);
                // //     });
                // var monitorTransmissionsSub = XbeeService.xbee
                //     .monitorTransmissions()
                //     .subscribe(function (transmissionPacket) {
                //         // do something with the packet
                //         console.log("Recieved remote transmission:", transmissionPacket.data);
                //     });
                return true;
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
