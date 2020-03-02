import { DeviceService } from "./device.service";
import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, concatMap, scan, reduce } from "rxjs/operators";
import { empty, timer, Observable, of, forkJoin } from "rxjs";
import { XbeeHelper } from "../xbee/xbee.helper";
import { XbeeService } from "../xbee.service";

export class TransceiverService extends DeviceService {


    public DIO = { D1: undefined, D2: undefined, D3: undefined, D4: undefined, D11: undefined, D12: undefined };

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
            mergeMap((nodes: Array<any>) => {
                const obsLst: Array<Observable<any>> = [];
                nodes.forEach(node => {
                    if (node.type === 2) { // => router
                        obsLst.push(this.scan(node.dest16, node.sh, node.sl));
                    }
                });
                if (obsLst.length > 0) {
                    return forkJoin(obsLst).pipe(mergeMap((results: Array<any>) => {
                        const res = results;

                        return of([]);
                    }));
                }

                return of([]);
            }));
    }

    public appendCoordinator(): any {
        // get coordinator information
        return {};
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
                                        this.scan(result.my.commandData.buffer, result.sh.commandData.buffer, result.sl.commandData.buffer)
                                    ))
                            ))
                    ))
            ));
    }

    public scan(dest16: string | ArrayBuffer | SharedArrayBuffer, sh: string | ArrayBuffer | SharedArrayBuffer, sl: string | ArrayBuffer | SharedArrayBuffer): Observable<any> {
        return this.requestRtg(0, dest16, sh, sl)
            .pipe(mergeMap((resultRtg: any) =>
                this.requestLqi(0, dest16, sh, sl)
                    .pipe(mergeMap((resultLqi: any) =>
                        of({ source: { destination16: dest16, destination64: { SH: sh, SL: sl } }, routing: resultRtg, lqi: resultLqi })
                    ))
            ));
    }

    public requestRtg(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, sh: string | ArrayBuffer | SharedArrayBuffer, sl: string | ArrayBuffer | SharedArrayBuffer, lstRtg?: any): Observable<any> {
        let recResult = lstRtg;
        if (!recResult) {
            recResult = [];
        }
        const dest64 = XbeeHelper.concatBuffer(sh, sl);
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
            recResult.push(object);
            if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), dest16, sh, sl, recResult);
            }

            return of(recResult);
        }));
    }

    public requestLqi(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, sh: string | ArrayBuffer | SharedArrayBuffer, sl: string | ArrayBuffer | SharedArrayBuffer, lstlqi?: any): Observable<any> {
        let recResult = lstlqi;
        if (!recResult) {
            recResult = [];
        }
        const dest64 = XbeeHelper.concatBuffer(sh, sl);
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
            recResult.push(object);
            if (object.neighbortableentries > Number(object.neighborlqilistcount) + Number(object.startindex)) {
                return this.requestLqi(XbeeHelper.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), dest16, sh, sl, recResult);
            }

            return of(recResult);
        }));
    }

    // output high/low - input - adc
    public setCfgIOFull(adress: ArrayBuffer | string, typeIo: number): Observable<any> {
        let config;
        Object.assign(config, this.DIO);
        if (typeIo === 4 || 5) { // output /HIGH 
            config.D1 = typeIo;
            config.D2 = typeIo;
            config.D3 = typeIo;
            config.D4 = typeIo;
            config.D11 = typeIo;
            config.D12 = typeIo;
            if (typeIo === 5) { //input
                // set IC
            }
        } else if (typeIo === 7) { // spi
            config.D1 = typeIo;
            config.D2 = typeIo;
            config.D3 = typeIo;
            config.D4 = typeIo;
        } else if (typeIo === 8) { // adc
            config.D1 = typeIo;
            config.D2 = typeIo;
            config.D3 = typeIo;
        }

        // executte for each command

        // at the end send WR  / AC ?

        return of(true);
    }

    public setCfgRouter(adress: ArrayBuffer | string, isCoordinator: boolean): Observable<any> {
        //get longest SP SM endDevice
        //SP of the coordinator / router greater than the longest sp 
        //ST less than the longest sleeping device
        const config = { SP: 0, ST: 0 };


        //if coordinator localCommand
        //if router remoteCommand
        // executte for each command

        // at the end send WR 

        return of(true);
    }

    public setCfgEndDevice(adress: ArrayBuffer | string): Observable<any> {
        const config = { SP: 0, ST: 0, IR: 0 };

        // executte for each command

        // at the end send WR

        return of(true);
    }

}
