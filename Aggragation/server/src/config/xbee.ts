import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { Observable, of, observable } from 'rxjs';
import { of as observableOf, from as observableFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { token } from 'morgan';

var xbeeRx = require('xbee-rx');

class XbeeService {

    public static xbee: any;
    constructor(serverInstance: http.Server) {
        XbeeService.xbee = xbeeRx({
            serialport: '/dev/ttyUSB0',
            api_mode: 2,
            defaultTimeoutMs: 5000 * 10,
            serialPortOptions: {
                baudRate: 9600
            },
            module: "ZigBee"
        });
    }

    public init(): Observable<WebSocket.Server> {
        return this.initListners().pipe(
            map(() => XbeeService.xbee));
    }

    public initListners(): Observable<void> {
        console.log('* start init websocket...');
        return observableOf(true).pipe(
            map(() => {
                // var allPacketSub = XbeeService.xbee.allPackets
                //     .subscribe(function (packet) {
                //         console.log("Packet recieved:", packet);
                //     });
                // var monitorIODataSub = XbeeService.xbee
                //     .monitorIODataPackets()
                //     .subscribe(function (ioSamplePacket) {
                //         console.log("Analog sample from AD0:", ioSamplePacket.analogSamples.AD0);
                //     });
                // var monitorTransmissionsSub = XbeeService.xbee
                //     .monitorTransmissions()
                //     .subscribe(function (transmissionPacket) {
                //         // do something with the packet
                //         console.log("Recieved remote transmission:", transmissionPacket.data);
                //     });
            }));
    }
    
    public static GetNodeDiscovery(): Observable<any> {
        return XbeeService.xbee.localCommand({
            command: "ND"
        }).pipe(map((response: any) => {
            return response;
        }))
    }

    public static switchDigital(port: string, value: boolean,address:string): Observable<any> {
        return XbeeService.xbee.remoteCommand({
            command: port,
            commandParameter: [value ? 5 : 4],
            destination64: address// '0013a20040b971f3'
        }).pipe(map((response: any) => {
            return response;
        }))
    }



}
export default XbeeService;