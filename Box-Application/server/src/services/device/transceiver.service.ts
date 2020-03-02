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
            .pipe(flatMap((ntResult: any) => {
                const timeoutMs = ntResult.commandData.readInt16BE(0) * 100;
                console.log("Got node discovery timeout:", timeoutMs, "ms");

                return nodeDiscoveryRepliesStream.pipe(
                    takeUntil(timer(timeoutMs + 1000)),
                    merge(nodeDiscoveryCommandStream)
                ).pipe(
                    reduce((a, c) => [...a, c], [])
                );
            }));
    }

    public Scan(): Observable<any> {
        return this.GetNodeDiscovery().pipe(
            mergeMap((node: any) =>
                of(true))
        );
    }

    public coordinatorInitScan(): Observable<any> {

        const coordinatorInformationObs = XbeeHelper.executeLocalCommand('SH')
            .pipe(mergeMap((sh: any) =>
                XbeeHelper.executeLocalCommand('SL')
                    .pipe(mergeMap((sl: any) =>
                        XbeeHelper.executeLocalCommand('MY')
                            .pipe(mergeMap((my: any) =>
                                of({ sh, sl, my })
                            ))
                    ))
            ));

        return coordinatorInformationObs
            .pipe(mergeMap((result: any) =>
                XbeeHelper.executeLocalCommand('OP')
                    .pipe(mergeMap((op: any) =>
                        XbeeHelper.executeLocalCommand('CH')
                            .pipe(mergeMap((ch: any) =>
                                XbeeHelper.executeLocalCommand('AO', 1)
                                    .pipe(mergeMap((ao: any) =>
                                        this.requestRtg(0, result.my.commandData.buffer, XbeeHelper.concatBuffer(result.sh.commandData.buffer, result.sl.commandData.buffer))
                                            .pipe(mergeMap((resultRtg: any) =>
                                                this.requestLqi(0, result.my.commandData.buffer, XbeeHelper.concatBuffer(result.sh.commandData.buffer, result.sl.commandData.buffer))
                                                    .pipe(mergeMap((resultLqi: any) =>
                                                        of({ routing: resultRtg, lqi: resultLqi })
                                                    ))
                                            ))
                                    ))
                            ))
                    ))
            ));
    }


    public requestRtg(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, dest64: string | ArrayBuffer | SharedArrayBuffer, lstRtg?: any): Observable<any> {
        let recResult = lstRtg;
        if (!recResult) {
            recResult = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: dest64, // "0013A20040C04982" default is broadcast address
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
            object['destination64'] = XbeeHelper.toHexString(dest64);
            object['destination16'] = XbeeHelper.toHexString(dest16);
            recResult.push(object);
            if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), dest64, recResult);
            }

            return of(recResult);
        }));
    }

    public requestLqi(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, dest64: string | ArrayBuffer | SharedArrayBuffer, lstlqi?: any): Observable<any> {
        let recResult = lstlqi;
        if (!recResult) {
            recResult = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: dest64, // "0013A20040C04982" default is broadcast address
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
            object['destination64'] = XbeeHelper.toHexString(dest64);
            object['destination16'] = XbeeHelper.toHexString(dest16);
            recResult.push(object);
            if (object.neighbortableentries > Number(object.neighborlqilistcount) + Number(object.startindex)) {
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), dest64, recResult);
            }

            return of(recResult);
        }));
    }

}
