import { DeviceService } from "./device.service";
import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, concatMap, scan, reduce } from "rxjs/operators";
import { empty, timer, Observable, of } from "rxjs";
import { XbeeHelper } from "../xbee/xbee.helper";
import { XbeeService } from "../xbee.service";

export class TransceiverService extends DeviceService {

    public configuretransceiver(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...
        return {};
    }

    public testBroadcast(): Observable<any> {
        return this.xbee._ExplicitAdressing();
    }

    public GetNodeDiscovery(): Observable<any> {

        // we want to ignore the command stream result as well as any error (for no
        // reply resulting from no found nodes)
        const nodeDiscoveryCommandStream = this.xbee.localCommand({ command: "ND" })
            .pipe(
                catchError(empty),
                ignoreElements()
            );

        const nodeDiscoveryRepliesStream = this.xbee.allPackets
            .pipe(
                filter((packet: any) => packet.type === xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE && packet.command === "ND"),
                pluck("nodeIdentification")
            );

        return this.xbee.localCommand({ command: "NT" })
            .pipe(
                flatMap((ntResult: any) => {
                    const timeoutMs = ntResult.commandData.readInt16BE(0) * 100;
                    console.log("Got node discovery timeout:", timeoutMs, "ms");

                    return nodeDiscoveryRepliesStream.pipe(
                        takeUntil(timer(timeoutMs + 1000)),
                        merge(nodeDiscoveryCommandStream)
                    ).pipe(
                        reduce((a, c) => [...a, c], [])
                    );
                })
            );
    }

    public Scan(): Observable<any> {
        // call OP cammnd
        let OPRes;
        let CHRes;

        return this.GetNodeDiscovery().pipe(
            mergeMap((node: any) => {
                return of(true);
            })
        )

    }


    public coordinatorInitScan(): Observable<any> {

        const coordinatorInformationObs = XbeeHelper.executeLocalCommand('SH')
            // tslint:disable-next-line: arrow-return-shorthand
            .pipe(mergeMap((sh: any) => {
                return XbeeHelper.executeLocalCommand('SL')
                    // tslint:disable-next-line: arrow-return-shorthand
                    .pipe(mergeMap((sl: any) => {
                        return XbeeHelper.executeLocalCommand('MY')
                            // tslint:disable-next-line: arrow-return-shorthand
                            .pipe(mergeMap((my: any) => {
                                const s = sh;
                                const l = sl;
                                const m = my;

                                return of({ sh, sl, my });
                            }));
                    }));
            }));

        return coordinatorInformationObs.pipe(
            mergeMap((result: any) => {
                return XbeeHelper.executeLocalCommand('OP')
                    .pipe(mergeMap((op: any) => {
                        return XbeeHelper.executeLocalCommand('CH')
                            .pipe(mergeMap((ch: any) => {
                                return XbeeHelper.executeLocalCommand('AO', 1)
                                    // tslint:disable-next-line: arrow-return-shorthand
                                    .pipe(mergeMap((ao: any) => {
                                        const address = this.concatBuffer(result.sh.commandData.buffer, result.sl.commandData.buffer);
                                        return this.requestRtg(0, address).pipe(mergeMap((resultRtg) => {
                                            const rtg = resultRtg;
                                            return this.requestLqi(0, address).pipe(mergeMap((resultLqi) => {
                                                return of({ resultRtg: resultRtg, resultLqi: resultLqi });
                                            }));
                                        }));
                                    }));
                            }));
                    }));
            }));
    }

    public concatBuffer(buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    };


    public requestRtg(start: any, adress: string | ArrayBuffer | SharedArrayBuffer, recResult?: any): Observable<any> {
        if (!recResult) {
            recResult = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: adress, // "0013A20040C04982" default is broadcast address
            destination16: "fffe", // default is "fffe" (unknown/broadcast)
            sourceEndpoint: 0x00,
            destinationEndpoint: 0x00,
            clusterId: "0032",
            profileId: "0000",
            broadcastRadius: 0x00, // optional, 0x00 is default
            options: 0x00, // optional, 0x00 is default
            data: [0x01, start] // Can either be string or byte array.
        };

        return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultRtg: any) => {
            const object = XbeeHelper.routingTable(resultRtg.data);
            recResult.push(object);
            if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
                return this.requestRtg(this.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), adress, recResult);
            }

            return of(recResult);
        }));
    }



    public requestLqi(start: any, adress: string | ArrayBuffer | SharedArrayBuffer, recResult?: any): Observable<any> {
        if (!recResult) {
            recResult = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: adress, // "0013A20040C04982" default is broadcast address
            destination16: "fffe", // default is "fffe" (unknown/broadcast)
            sourceEndpoint: 0x00,
            destinationEndpoint: 0x00,
            clusterId: "0031",
            profileId: "0000",
            broadcastRadius: 0x00, // optional, 0x00 is default
            options: 0x00, // optional, 0x00 is default
            data: [0x01, start] // Can either be string or byte array.
        };

        return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultlqi: any) => {
            const object = XbeeHelper.lqiTable(resultlqi.data);
            recResult.push(object);
            if (object.neighbortableentries > Number(object.neighborlqilistcount) + Number(object.startindex)) {
                return this.requestRtg(this.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), adress, recResult);
            }

            return of(recResult);
        }));
    }


    public decimalToHexString(number) {
        if (number < 0) {
            number = 0xFFFFFFFF + number + 1;
        }

        return this.hexToBytes(number.toString(16).toUpperCase());
    }

    // Convert a hex string to a byte array
    public hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

}
