import { DeviceService } from "./device.service";
import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, concatMap, scan, reduce, delay, take, tap } from "rxjs/operators";
import { empty, timer, Observable, of, forkJoin } from "rxjs";
import { XbeeHelper } from "../../services/xbee/xbee.helper";
import { XbeeService } from "../../services/xbee.service";
import { Transceiver } from "../classes/transceiver.class";
import { TRANSCIEVER_TYPE } from "../classes/device.class";
import { IOCfg, TYPE_IOCFG } from "../classes/iocfg.class";

export class TransceiverService extends DeviceService {

    public transceivers: Array<Transceiver> = [];
    // JSON.parse(`[
    //     {
    //        "id":"0013a20040c04982",
    //        "infos":{
    //           "address64":"0013a20040c04982",
    //           "address16":"0000",
    //           "type":0
    //        },
    //        "sleepCfg":{
    //           "SP":{},
    //           "SN":{}
    //        },
    //        "routings":[],
    //        "links":[]
    //     },
    //     {
    //        "id":"0013a20040c0497d",
    //        "infos":{
    //           "address64":"0013a20040c0497d",
    //           "address16":"fc1a",
    //           "type":1,
    //           "nodeIdentifier":" ",
    //           "remoteParent16":"fffe",
    //           "digiProfileID":"c105",
    //           "digiManufacturerID":"101e"
    //        },
    //        "sleepCfg":{
    //           "SP":{
    //              "type":"Buffer",
    //              "data":[
    //                 0,
    //                 32
    //              ]
    //           },
    //           "SN":{
    //              "type":"Buffer",
    //              "data":[
    //                 0,
    //                 1
    //              ]
    //           }
    //        }
    //     },
    //     {
    //        "id":"0013a20040b971f3",
    //        "infos":{
    //           "address64":"0013a20040b971f3",
    //           "address16":"f634",
    //           "type":2,
    //           "nodeIdentifier":" ",
    //           "remoteParent16":"0000",
    //           "digiProfileID":"c105",
    //           "digiManufacturerID":"101e"
    //        }
    //     }
    //  ]`);

    public initTransceivers(): Observable<boolean> {
        return this.requestXbeeNodes()
            .pipe(mergeMap((result: boolean) => {
                let cmdObs: Observable<any> = of(true);
                this.transceivers.forEach(node => {
                    cmdObs = cmdObs.pipe(mergeMap((result: any) => this.getSleepAttributes(node).pipe(map((ao: any) => true))));
                });
                return cmdObs;
            }))
            .pipe(mergeMap((nodes: any) =>
                this.scanAll(this.transceivers.filter(transceiver => transceiver.infos.type === 0)[0])))
            .pipe(mergeMap((nodes: any) => {
                this.startListenJoinTransceiver().subscribe();
                /// test zone
                //return this.setMaxSleepCycle();
                return of(true);
            }));
    }

    //todo filter function to skip routing inactive


    public requestXbeeNodes(): Observable<boolean> {
        const coordinatorInformationObs = XbeeHelper.executeLocalCommand('SH')
            .pipe(mergeMap((sh: any) =>
                XbeeHelper.executeLocalCommand('SL')
                    .pipe(mergeMap((sl: any) =>
                        XbeeHelper.executeLocalCommand('MY')
                            .pipe(map((my: any) => {
                                const coordinator = this.buildCoordinatorTransceiver(my, sh, sl);
                                return this.setTransceiver(coordinator);
                            }))
                    ))
            ));
        return coordinatorInformationObs
            .pipe(mergeMap((coordinator: Transceiver) =>
                this.GetNodeDiscovery().pipe(mergeMap((nodes: any) => {
                    nodes.forEach(node => this.setTransceiver(node));
                    return of(true);
                }))
            ));
    }

    public startListenJoinTransceiver(): Observable<boolean> {
        return this.xbee.allPackets.pipe(filter((packet: any) => packet.type === 0x95))
            .pipe(mergeMap((packet: any) => {
                const transceiver = this.setTransceiver(packet);
                return this.getSleepAttributes(transceiver).pipe(map((ao: any) => true));
            }));
    }

    public setTransceiver(data: any): Transceiver {
        let transceiver = this.transceivers.find((trans: Transceiver) => trans.id === (data.remote64 || data.sender64));
        if (transceiver) {
            //todo update function
            //transceiver = new Transceiver(data);
            // return save to database
            return transceiver;
        }
        this.transceivers.push(new Transceiver(data));
        // save database
        return transceiver;
    }

    public getSleepAttributes(transceiver: Transceiver): Observable<any> {
        if (transceiver.infos.type === TRANSCIEVER_TYPE.COORDINATOR) {
            return XbeeHelper.executeLocalCommand('SP')
                .pipe(mergeMap((sp: any) =>
                    XbeeHelper.executeLocalCommand('SN')
                        .pipe(map((sn: any) =>
                            (transceiver).setsleepCfg({ SP: sp, ST: undefined, SM: undefined, SN: sn })
                        ))
                ));
        }

        return XbeeHelper.executeRemoteCommand(60000, 'SP', transceiver.id)
            .pipe(mergeMap((sp: any) =>
                XbeeHelper.executeRemoteCommand(60000, 'ST', transceiver.id)
                    .pipe(mergeMap((st: any) =>
                        XbeeHelper.executeRemoteCommand(60000, 'SM', transceiver.id)
                            .pipe(mergeMap((sm: any) =>
                                XbeeHelper.executeRemoteCommand(60000, 'SN', transceiver.id)
                                    .pipe(map((sn: any) =>
                                        transceiver.setsleepCfg({ SP: sp, ST: st, SM: sm, SN: sn })
                                    ))
                            ))
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

    public scanAll(coordinator: Transceiver): Observable<boolean> {
        return this.coordinatorInitScan(coordinator)
            .pipe(mergeMap((coordinatorSource: any) => this.scan()))
            .pipe(mergeMap((coordinatorSource: any) => XbeeHelper.executeLocalCommand('AO', [0x00])))
            .pipe(mergeMap((coordinatorSource: any) => XbeeHelper.executeLocalCommand('AC')));
    }

    public scan(): Observable<any> {
        return this.GetNodeDiscovery().pipe(
            mergeMap((nodes: Array<any>) => {
                const obsLst: Array<Observable<any>> = [];
                nodes.forEach(node => {
                    const transceiver = this.setTransceiver(node);
                    console.log('node joined the network', transceiver);
                    //todo getSleepConfig
                    if (node.deviceType === 1) { // => router
                        obsLst.push(this.scanUnitaire(transceiver));
                    }
                });
                return obsLst.length > 0 ? forkJoin(obsLst).pipe(mergeMap((results: Array<any>) => of(true))) : of([]);
            }));
    }

    //TODO AFTER finish scan set AO to 0
    public coordinatorInitScan(coordinator: Transceiver): Observable<any> {
        return XbeeHelper.executeLocalCommand('OP')
            .pipe(mergeMap((op: any) =>
                XbeeHelper.executeLocalCommand('CH')
                    .pipe(mergeMap((ch: any) =>
                        XbeeHelper.executeLocalCommand('AO', [1])
                            .pipe(mergeMap((ao: any) => this.scanUnitaire(coordinator)
                            ))
                    ))
            ));
    }

    public buildCoordinatorTransceiver(MY: any, SH: any, SL: any): any {
        return { id: "", remote64: XbeeHelper.toHexString(XbeeHelper.concatBuffer(SH.commandData, SL.commandData)), remote16: XbeeHelper.toHexString(MY.commandData), deviceType: 0, nodeIdentifier: undefined, remoteParent16: undefined, digiProfileID: undefined, digiManufacturerID: undefined };
    }

    public scanUnitaire(transceiver: Transceiver): Observable<Transceiver> {
        const trans = transceiver.infos;
        return this.requestRtg(0, transceiver)
            .pipe(mergeMap((resultRtg: any) =>
                this.requestLqi(0, transceiver)
                    .pipe(mergeMap((resultLqi: any) =>
                        of(transceiver)
                    ))
            ));
    }

    public requestRtg(start: any, transceiver: Transceiver): Observable<Transceiver> {
        const trans = transceiver.infos;
        if (!transceiver.routings) {
            transceiver.routings = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: trans.address64, // "0013A20040C04982" default is broadcast address
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
            transceiver.routings.push(object);
            if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), transceiver);
            }

            return of(transceiver);
        }));
    }

    public requestLqi(start: any, transceiver: Transceiver): Observable<Transceiver> {
        const trans = transceiver.infos;
        if (!transceiver.links) {
            transceiver.links = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: trans.address64, // "0013A20040C04982" default is broadcast address
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
            transceiver.links.push(object);
            if (object.neighbortableentries > Number(object.neighborlqilistcount) + Number(object.startindex)) {
                return this.requestLqi(XbeeHelper.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), transceiver);
            }

            return of(transceiver);
        }));
    }

    public applyFullAnalog(transceiver: Transceiver): Observable<boolean> {
        const config = new IOCfg(TYPE_IOCFG.FULL_ANALOG_INPUT);
        return this.applyConfiguration(transceiver, config);
    }

    // TODO gettimeout of SP and default .
    public applyConfiguration(transceiver: Transceiver, configuration: IOCfg): Observable<any> {
        const isSleepy: boolean = transceiver.infos.type === TRANSCIEVER_TYPE.ENDDEVICE && transceiver.sleepCfg.SM === 5;

        if (!isSleepy) {
            return this.setConfig(transceiver.id, configuration)
                .pipe(mergeMap((result: boolean) => {
                    if (result) {
                        return XbeeHelper.executeRemoteCommand(60000, 'WR', transceiver.id, undefined, 0x02).pipe(map((ao: any) => true));
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

        return this.disableSleep(transceiver.id)
            .pipe(mergeMap((disableResult: any) =>
                this.setConfig(transceiver.id, configuration)
                    .pipe(mergeMap((result: boolean) => this.enableSleep(transceiver.id)))
                    .pipe(mergeMap((result: boolean) => {
                        if (result) {
                            return XbeeHelper.executeRemoteCommand(60000, 'WR', transceiver.id, undefined, 0x02).pipe(map((ao: any) => true));
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

    public setConfig(adrress: string, configuration: IOCfg): Observable<any> {
        let cmdObs: Observable<boolean> = of(true);

        for (const cmd of Object.keys(configuration)) {
            const params = configuration[cmd];
            cmdObs = cmdObs.pipe(mergeMap((result: any) => XbeeHelper.executeRemoteCommand(1000, cmd, adrress, params).pipe(map((ao: any) => true))));
        }
        return cmdObs;
    }

    public setMaxSleepCycle(): Observable<any> {
        let cmdObs: Observable<boolean> = of(true);
        const coordinator = this.transceivers.filter(transceiver => transceiver.infos.type === 0)[0];
        const routers = this.transceivers.filter(transceiver => transceiver.infos.type === 1);
        const endDevices = this.transceivers.filter(transceiver => transceiver.infos.type === 2);
        // the max SP of endDevice all routers an coordinator must have greater value
        const maxSPValue = Math.max.apply(Math, endDevices.map((endDevice: Transceiver) => XbeeHelper.byteArrayToNumber(endDevice.sleepCfg.SP)));

        if (XbeeHelper.byteArrayToNumber(coordinator.sleepCfg.SP) < maxSPValue) {
            cmdObs = cmdObs.pipe(mergeMap((result: any) => XbeeHelper.executeRemoteCommand(60000, 'SP', coordinator.id, XbeeHelper.numberToBytes(maxSPValue)).pipe(map((ao: any) => true))));
        }

        routers.forEach(router => {
            if (XbeeHelper.byteArrayToNumber(router.sleepCfg.SP) < maxSPValue) {
                // update SP of router
                cmdObs = cmdObs.pipe(mergeMap((result: any) => XbeeHelper.executeRemoteCommand(60000, 'SP', router.id, XbeeHelper.numberToBytes(maxSPValue)).pipe(map((ao: any) => true))));
            }
        });

        return cmdObs
            .pipe(mergeMap((result: boolean) => {
                let writeCmdObs: Observable<boolean> = of(true);
                writeCmdObs = writeCmdObs.pipe(mergeMap((result: boolean) => XbeeHelper.executeLocalCommand('WR').pipe(map((ao: any) => true))));

                routers.forEach(router => {
                    writeCmdObs = writeCmdObs.pipe(mergeMap((result: boolean) => XbeeHelper.executeRemoteCommand(60000, 'WR', router.id, undefined, 0x02).pipe(map((ao: any) => true))));
                });

                return writeCmdObs;
            }))
            .pipe(mergeMap((result: boolean) => {
                console.log('save sleep config to data base');
                return of(true);
            }));
    }

}
