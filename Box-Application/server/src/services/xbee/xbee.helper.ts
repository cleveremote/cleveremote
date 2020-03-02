import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, catchError, ignoreElements, filter, pluck, takeUntil, flatMap, merge } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, empty, timer } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { XbeeService } from '../xbee.service';
import * as  hexToBinary from 'hex-to-binary';
import endianness from 'endianness';

export class XbeeHelper {
    public static position = 0;
    public static executeRemoteCommand(cmd: string, address: string, params: number): Observable<any> {
        const localCommandObj = { command: cmd, destination64: address } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }

        return XbeeService.xbee.remoteCommand(localCommandObj).pipe(map((response: any) => response));
    }

    public static executeLocalCommand(cmd: string, params?: number): Observable<any> {
        const localCommandObj = { command: cmd } as any;
        if (params) {
            localCommandObj.commandParameter = [params];
        }

        return XbeeService.xbee.localCommand(localCommandObj).pipe(map((response: any) => response));
    }

    public static testFunction(testRep: number, position?: number): void {
        if (position) {
            XbeeHelper.position = position;
        }

        console.log("test static vlaue position test num " + testRep, XbeeHelper.position);
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
        item['routingtablelist'] = routingtablelistObj.value;

        return item;
    }

    public static readListRoutingTable(buffer: any, length: number, position: number): any {
        const value = [];
        const routingLstLength = length;

        const statusLookup: { [n: number]: string } = {
            0: 'ACTIVE',
            1: 'DISCOVERY_UNDERWAY',
            2: 'DISCOVERY_FAILED',
            3: 'INACTIVE'
        };

        for (let i = 0; i < routingLstLength; i++) {
            const destNwkAddrObj = XbeeHelper.readUInt16(buffer, position);
            const routeStatusObj = XbeeHelper.readUInt8(buffer, destNwkAddrObj.position);
            const nextHopNwkAddrObj = XbeeHelper.readUInt16(buffer, routeStatusObj.position);

            const item: { [s: string]: number | string } = {};
            item['destNwkAddr'] = destNwkAddrObj.value;
            item['routeStatus'] = statusLookup[routeStatusObj.value];
            item['nextHopNwkAddr'] = nextHopNwkAddrObj.value;
            value.push(item);
        }

        return value;
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
        item['neighborlqilist'] = neighborlqilistObj.value;

        return item;
    }

    public static concatBuffer(buffer1, buffer2): ArrayBuffer {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

        return tmp.buffer;
    }

    public static decimalToHexString(element: number): Array<number> {
        let toConvert = element;
        if (toConvert < 0) {
            toConvert = 0xFFFFFFFF + toConvert + 1;
        }

        return XbeeHelper.hexToBytes(toConvert.toString(16).toUpperCase());
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
        return Array.from(byteArray, (byte: any) => {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    private static readListNeighborLqi(buffer: any, length: number, position: number): any {
        const value = [];
        const lqiLstLength = length;
        for (let i = 0; i < lqiLstLength; i++) {
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

            value.push(item);
        }

        return value;
    }


    private static readIeeeAddr(buffer, position: number): any {
        let pos = position;
        const length = 8;
        const value = buffer.slice(position, position + length);
        pos += length;

        return XbeeHelper.addressBufferToString(value);
    }

    private static readUInt16(buffer, position: number): any {
        let pos = position;
        pos += 2;

        return { value: buffer.readUInt16LE(position), position: pos };
    }

    private static readUInt8(buffer, position: number): any {
        let pos = position;

        return { value: buffer.readUInt8(position), position: pos++ };
    }

    private static addressBufferToString(buffer: Buffer): string {
        let address = '0x';
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






}
