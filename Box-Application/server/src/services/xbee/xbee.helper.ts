import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, catchError, ignoreElements, filter, pluck, takeUntil, flatMap, merge, retryWhen } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, empty, timer } from 'rxjs';
// import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { XbeeService } from '../xbee.service';
import * as  hexToBinary from 'hex-to-binary';
import endianness from 'endianness';
import * as xbeeRx from 'xbee-rx';
import { genericRetryStrategy } from '../tools/generic-retry-strategy';

export class XbeeHelper {
    public static position = 0;
    public static executeRemoteCommand(timeout: number, cmd: string, address: string | ArrayBuffer, params?: Array<number> | string, option?: number): Observable<any> {
        const localCommandObj = { command: cmd, destination64: address, timeoutMs: timeout, options: option } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }
        console.log('Commande log', cmd);

        return of(true)
            .pipe(mergeMap((res: boolean) => XbeeService.xbee.remoteCommand(localCommandObj)
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

    public static executeLocalCommand(cmd: string, params?: Array<number> | string): Observable<any> {
        const localCommandObj = { command: cmd } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }
        return XbeeService.xbee.localCommand(localCommandObj).pipe(map((response: any) => {
            return response;
        }));
    }

    public static routingTable(buffer): { [s: string]: number | string } {
        const position = 0;
        const idObj = XbeeHelper.readUInt8(buffer, position);
        const statusObj = XbeeHelper.readUInt8(buffer, idObj.position);
        const routingtableentriesObj = XbeeHelper.readUInt8(buffer, statusObj.position);
        const startindexObj = XbeeHelper.readUInt8(buffer, routingtableentriesObj.position);
        const routingtablelistcountObj = XbeeHelper.readUInt8(buffer, startindexObj.position);
        const routingtablelistObj = XbeeHelper.readListRoutingTable(buffer, Number(routingtablelistcountObj.value), routingtablelistcountObj.position);

        const item: { [s: string]: number | string } = {};
        item['id'] = idObj.value;
        item['status'] = statusObj.value;
        item['routingtableentries'] = routingtableentriesObj.value;
        item['startindex'] = startindexObj.value;
        item['routingtablelistcount'] = routingtablelistcountObj.value;
        item['routingtablelist'] = routingtablelistObj;

        return item;
    }

    public static readListRoutingTable(buffer: any, length: number, position: number): any {
        const value = [];
        const routingLstLength = length;


        let obj = { value: undefined, position: position } as any;
        for (let i = 0; i < routingLstLength; i++) {
            obj = XbeeHelper.buildItemRtg(buffer, obj.position);
            value.push(obj.value);
        }

        return value;
    }

    public static buildItemRtg(buffer: any, position: number): any {
        const statusLookup: { [n: number]: string } = {
            0: 'ACTIVE',
            1: 'DISCOVERY_UNDERWAY',
            2: 'DISCOVERY_FAILED',
            3: 'INACTIVE'
        };

        const destNwkAddrObj = XbeeHelper.readUInt16(buffer, position);
        const routeStatusObj = XbeeHelper.readUInt8(buffer, destNwkAddrObj.position);
        const nextHopNwkAddrObj = XbeeHelper.readUInt16(buffer, routeStatusObj.position);

        const item: { [s: string]: number | string } = {};
        item['destNwkAddr'] = destNwkAddrObj.value;
        item['routeStatus'] = statusLookup[routeStatusObj.value];
        item['nextHopNwkAddr'] = nextHopNwkAddrObj.value;

        return { value: item, position: nextHopNwkAddrObj.position };
    }

    public static lqiTable(buffer): { [s: string]: number | string } {
        const position = 0;
        const idObj = XbeeHelper.readUInt8(buffer, position);
        const statusObj = XbeeHelper.readUInt8(buffer, idObj.position);
        const neighbortableentriesObj = XbeeHelper.readUInt8(buffer, statusObj.position);
        const startindexObj = XbeeHelper.readUInt8(buffer, neighbortableentriesObj.position);
        const neighborlqilistcountObj = XbeeHelper.readUInt8(buffer, startindexObj.position);
        const neighborlqilistObj = XbeeHelper.readListNeighborLqi(buffer, Number(neighborlqilistcountObj.value), neighborlqilistcountObj.position);

        const item: { [s: string]: number | string } = {};

        item['id'] = idObj.value;
        item['status'] = statusObj.value;
        item['neighbortableentries'] = neighbortableentriesObj.value;
        item['startindex'] = startindexObj.value;
        item['neighborlqilistcount'] = neighborlqilistcountObj.value;
        item['neighborlqilist'] = neighborlqilistObj;

        return item;
    }

    public static readListNeighborLqi(buffer: any, length: number, position: number): any {
        const value = [];
        const lqiLstLength = length;
        let obj = { value: undefined, position: position } as any;
        for (let i = 0; i < lqiLstLength; i++) {
            obj = XbeeHelper.buildItemLqi(buffer, obj.position);
            value.push(obj.value);
        }
        return value;
    }

    public static buildItemLqi(buffer: any, position: number): any {
        const item: { [s: string]: number | string } = {};
        const extPandIdObj = XbeeHelper.readIeeeAddr(buffer, position);
        const extAddrObj = XbeeHelper.readIeeeAddr(buffer, extPandIdObj.position);
        const nwkAddrObj = XbeeHelper.readUInt16(buffer, extAddrObj.position);
        const value1Obj = XbeeHelper.readUInt8(buffer, nwkAddrObj.position);
        const deviceType = value1Obj.value & 0x03;
        const rxOnWhenIdle = (value1Obj.value & 0x0C) >> 2;
        const relationship = (value1Obj.value & 0x70) >> 4;
        const permitJoinObj = XbeeHelper.readUInt8(buffer, value1Obj.position);
        const depthObj = XbeeHelper.readUInt8(buffer, permitJoinObj.position);
        const lqiObj = XbeeHelper.readUInt8(buffer, depthObj.position);

        item['extPandId'] = extPandIdObj.value;
        item['extAddr'] = extAddrObj.value;
        item['nwkAddr'] = nwkAddrObj.value;
        item['deviceType'] = deviceType;
        item['rxOnWhenIdle'] = rxOnWhenIdle;
        item['relationship'] = relationship;
        item['permitJoin'] = permitJoinObj.value & 0x03;
        item['depth'] = depthObj.value;
        item['lqi'] = lqiObj.value;

        return { value: item, position: lqiObj.position };
    }


    public static readIeeeAddr(buffer, position: number): any {
        let pos = position;
        const length = 8;
        const value = buffer.slice(position, position + length);
        pos += length;
        return { value: XbeeHelper.addressBufferToString(value), position: pos };
    }

    public static readUInt16(buffer, position: number): any {
        let pos = position;
        pos += 2;
        return { value: buffer.readUInt16LE(position), position: pos };
    }

    public static readUInt8(buffer, position: number): any {
        let pos = position;
        pos++;
        return { value: buffer.readUInt8(position), position: pos };
    }

    public static addressBufferToString(buffer: Buffer): string {
        let address = '';
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer.readUInt8(buffer.length - i - 1);
            if (value <= 15) {
                address += '0' + value.toString(16);
            } else {
                address += value.toString(16);
            }
        }
        return address;
    }

    public static concatBuffer(buffer1, buffer2): ArrayBuffer {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

        return tmp;
    }

    public static decimalToHexString(element: number): Array<number> {
        let toConvert = element;
        if (toConvert < 0) {
            toConvert = 0xFFFFFFFF + toConvert + 1;
        }

        return XbeeHelper.hexToBytes(toConvert.toString(16).toUpperCase());
    }

    public static readInt(array) {
        var value = 0;
        for (var i = 0; i < array.length; i++) {
            value = (value * 256) + array[i];
        }
        return value;
    }

    // Convert a hex string to a byte array
    public static hexToBytes(hex): Array<number> {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }

        return bytes;
    }

    public static toHexString(byteArray): string {
        return Array.from(byteArray, (byte: any) =>
            ('0' + (byte & 0xFF).toString(16)).slice(-2)
        ).join('');
    }



    public static byteArrayToNumber(byteArray): number {
        var value = parseInt(XbeeHelper.toHexString(byteArray), 16);
        return value;
    }

    public static numberToBytes(value:number): Array<number> {
        const hex =  ('00000000000'+(value).toString(16)).substr(-4)
        
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }

        return bytes;
    }

}
