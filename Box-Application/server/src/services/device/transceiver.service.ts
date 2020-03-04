import { DeviceService } from "./device.service";
import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, concatMap, scan, reduce, delay, take } from "rxjs/operators";
import { empty, timer, Observable, of, forkJoin } from "rxjs";
import { XbeeHelper } from "../xbee/xbee.helper";
import { XbeeService } from "../xbee.service";
import { config } from "dotenv";

export class TransceiverService extends DeviceService {


    public configuretransceiver(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...
        return {};
    }

    public testBroadcast(): Observable<any> {
        return this.xbee._ExplicitAdressing();
    }

    public joiningDeviceListener(): void {
        this.xbee.allPackets.pipe(filter((packet: any) => {
            return packet.type === 0x95;
        })).subscribe(
            (packet: any) => {
                // TODO check if alreadyExists if not call scan.
                console.log('node joined the network', packet);
            }
        )
    }

    public getSleepAttributes(adrress?: string | ArrayBuffer): Observable<any> {
        if (adrress) {
            return XbeeHelper.executeRemoteCommand(60000, 'SP', adrress)
                .pipe(mergeMap((sp: any) =>
                    XbeeHelper.executeRemoteCommand(60000, 'ST', adrress)
                        .pipe(mergeMap((st: any) =>
                            XbeeHelper.executeRemoteCommand(60000, 'SM', adrress)
                                .pipe(mergeMap((sm: any) =>
                                    XbeeHelper.executeRemoteCommand(60000, 'SN', adrress)
                                        .pipe(mergeMap((sn: any) =>
                                            of({ SP: sp, ST: st, SM: sm, SN: sn })
                                        ))
                                ))
                        ))
                ));
        }

        return XbeeHelper.executeLocalCommand('SP')
            .pipe(mergeMap((sp: any) =>
                XbeeHelper.executeLocalCommand('SN')
                    .pipe(mergeMap((sn: any) =>
                        of({ SP: sp, ST: undefined, SM: undefined, SN: sn })
                    ))
            ));
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

    public scanAll(): Observable<any> {
        const dataSource = []; // { source: { destination16: dest16, destination64: { SH: sh, SL: sl } }, routing: resultRtg, lqi: resultLqi }
        return this.coordinatorInitScan()
            .pipe(mergeMap((coordinatorSource: any) => {
                dataSource.push(coordinatorSource);
                return this.scan().pipe(mergeMap((otherSources: Array<any>) => {
                    otherSources.forEach(source => {
                        dataSource.push(source);
                    });
                    return of(dataSource);
                }));
            }));
    }

    public scan(): Observable<any> {
        return this.GetNodeDiscovery().pipe(
            mergeMap((nodes: Array<any>) => {
                const obsLst: Array<Observable<any>> = [];
                nodes.forEach(node => {
                    if (node.deviceType === 1) { // => router
                        obsLst.push(this.scanUnitaire(node.remote16, node.remote64));
                    }
                });
                if (obsLst.length > 0) {
                    return forkJoin(obsLst).pipe(mergeMap((results: Array<any>) => {
                        const res = results;
                        return of(results);
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
                                        this.scanUnitaire( XbeeHelper.toHexString(result.my.commandData), XbeeHelper.toHexString(XbeeHelper.concatBuffer(result.sh.commandData.buffer, result.sl.commandData.buffer)))
                                    ))
                            ))
                    ))
            ));
    }

    public scanUnitaire(dest16: string | ArrayBuffer | SharedArrayBuffer, address: string | ArrayBuffer | SharedArrayBuffer): Observable<any> {
        return this.requestRtg(0, dest16, address)
            .pipe(mergeMap((resultRtg: any) =>
                this.requestLqi(0, dest16, address)
                    .pipe(mergeMap((resultLqi: any) =>
                        of({ source: { destination16: dest16, destination64: address }, routing: resultRtg, lqi: resultLqi })
                    ))
            ));
    }

    public requestRtg(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, address: string | ArrayBuffer | SharedArrayBuffer, lstRtg?: any): Observable<any> {
        let recResult = lstRtg;
        if (!recResult) {
            recResult = [];
        }
        const dest64 = address;//XbeeHelper.concatBuffer(sh, sl);
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
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), dest16, address, recResult);
            }

            return of(recResult);
        }));
    }

    public requestLqi(start: any, dest16: string | ArrayBuffer | SharedArrayBuffer, address: string | ArrayBuffer | SharedArrayBuffer, lstlqi?: any): Observable<any> {
        let recResult = lstlqi;
        if (!recResult) {
            recResult = [];
        }
        const dest64 = address;
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
                return this.requestLqi(XbeeHelper.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), dest16, address, recResult);
            }

            return of(recResult);
        }));
    }

    public applyFullDigital(adrress: string, isInput: boolean, isHigh: boolean): Observable<boolean> {
        const param = isInput ? [3] : isHigh ? [5] : [4];
        const configuration = [
            { cmd: 'D1', params: param },
            { cmd: 'D2', params: param },
            { cmd: 'D3', params: param },
            { cmd: 'D4', params: param },
            { cmd: 'P0', params: param },
            { cmd: 'P1', params: param }
        ];
        return this.applyConfiguration(adrress, configuration, true);
    }

    public applyFullAnalog(adrress: string): Observable<boolean> {
        const configuration = [
            { cmd: 'D1', params: [2] },
            { cmd: 'D2', params: [2] },
            { cmd: 'D3', params: [2] },
            { cmd: 'D4', params: [0] },
            { cmd: 'P0', params: [0] },
            { cmd: 'P1', params: [0] }
        ];
        return this.applyConfiguration(adrress, configuration, true);
    }

    public applyConfiguration(adrress: string, configuration: Array<any>, isSleepy: boolean): Observable<any> {
        if (!isSleepy) {
            return this.setConfig(adrress, configuration)
                .pipe(mergeMap((result: boolean) => {
                    if (result) {
                        return XbeeHelper.executeRemoteCommand(60000, 'WR', adrress, undefined, 0x02).pipe(map((ao: any) => true));
                    }
                    return of(false);
                }))
                .pipe(mergeMap((result: boolean) => {
                    if (result) {
                        console.log('save config to data base');
                    }
                    return of(true);
                }));
        }

        return this.disableSleep(adrress)
            .pipe(mergeMap((disableResult: any) =>
                this.setConfig(adrress, configuration)
                    .pipe(mergeMap((result: boolean) => this.enableSleep(adrress)))
                    .pipe(mergeMap((result: boolean) => {
                        if (result) {
                            return XbeeHelper.executeRemoteCommand(60000, 'WR', adrress, undefined, 0x02).pipe(map((ao: any) => true));
                        }
                        return of(false);
                    }))
                    .pipe(mergeMap((result: boolean) => {
                        if (result) {
                            console.log('save config to data base');
                        }
                        return of(true);
                    }))));

    }

    public disableSleep(adrress): Observable<any> {
        return XbeeHelper.executeRemoteCommand(60000, 'SM', adrress, [0], 0x02)
            .pipe(map((result: any) => true));
    }

    public enableSleep(adrress): Observable<boolean> {
        const nodeDiscoveryRepliesStream: Observable<boolean> = this.xbee.allPackets
            .pipe(filter((packet: any) => packet.type === xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX))
            .pipe(take(1))
            .pipe(map((x: any) => true));

        return XbeeHelper.executeRemoteCommand(1000, 'SM', adrress, [5], 0)
            .pipe(mergeMap((result: any) => nodeDiscoveryRepliesStream));
    }

    public setConfig(adrress: string, configuration: Array<any>): Observable<any> {
        let cmdObs: Observable<boolean> = of(true);
        configuration.forEach((el, index) => {
            cmdObs = cmdObs.pipe(mergeMap((result: any) => XbeeHelper.executeRemoteCommand(1000, el.cmd, adrress, el.params).pipe(map((ao: any) => true))));
        });
        return cmdObs;
    }

    public setMaxSleepCycle(devices: Array<any>): Observable<any> {
        const cmdObs: Array<Observable<any>> = [];
        const coordinator = devices.filter(device => device.type === 0)[0];
        const routers = devices.filter(device => device.type === 1);
        const endDevices = devices.filter(device => device.type === 2);
        // the max SP of endDevice all routers an coordinator must have greater value
        const maxSPValue = Math.max.apply(Math, endDevices.map((device: any) => {
            const configObj: Array<any> = JSON.parse(device.config);
            const spAttribute = configObj.find((cfg: any) => cfg.cmd === 'SP');
            return spAttribute.param;
        }));

        const configCoordinatorObj: Array<any> = JSON.parse(coordinator.config);
        const spCoordinatorAttribute = configCoordinatorObj.find((cfg: any) => cfg.cmd === 'SP');
        if (spCoordinatorAttribute < maxSPValue) {
            // update SP of coordinator
            cmdObs.push(XbeeHelper.executeRemoteCommand(60000, 'SP', coordinator.adrress, [maxSPValue])
                .pipe(mergeMap((res: any) => of({ res: true, device: coordinator }))));
        }

        routers.forEach(router => {
            const configRouterObj: Array<any> = JSON.parse(router.config);
            const spRouterAttribute = configRouterObj.find((cfg: any) => cfg.cmd === 'SP');
            if (spRouterAttribute < maxSPValue) {
                // update SP of router
                cmdObs.push(XbeeHelper.executeRemoteCommand(60000, 'SP', router.adrress, [maxSPValue])
                    .pipe(mergeMap((res: any) => of({ res: true, device: router }))));
            }
        });

        return forkJoin(cmdObs)
            .pipe(mergeMap((results: Array<any>) => {
                const writeCmdObs: Array<Observable<any>> = [];
                for (const result of results) {
                    if (!result.res) {
                        return of(false);
                    }
                    writeCmdObs.push(XbeeHelper.executeRemoteCommand(60000, 'WR', result.device.address, undefined, 0x02)
                        .pipe(mergeMap((res: any) => of({ res: true, device: result.device }))));
                }
                return forkJoin(writeCmdObs);
            }))
            .pipe(mergeMap((results: Array<any>) => {

                for (const result of results) {
                    if (result.res) {
                        console.log('save config to data base');
                    } else {
                        console.log('fail to write execute');
                    }
                }
                // make fork join to save
                return of(true);
            }));
    }

}
