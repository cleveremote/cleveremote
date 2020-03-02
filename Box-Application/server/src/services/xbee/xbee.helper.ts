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

    public static executeRemoteCommand(cmd: string, address: string, params: number): Observable<any> {
        const localCommandObj = { command: cmd, destination64: address } as any; // '0013a20040b971f3'
        if (params) {
            localCommandObj.commandParameter = params;
        }

        return XbeeService.xbee.localCommand(localCommandObj).pipe(map((response: any) => response));
    }

    public static executeLocalCommand(cmd: string, params?: number): Observable<any> {
        const localCommandObj = { command: cmd } as any; // '0013a20040b971f3'
        if (params) {
            localCommandObj.commandParameter = [params];
        }

        return XbeeService.xbee.localCommand(localCommandObj).pipe(map((response: any) => response));
    }

    public static position = 0;
    public static testFunction(buffer1): any {
        // const hexString = [0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82, 0x49, 0xC0, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00, 0x34, 0x02, 0x00, 0xFE, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF3, 0x71, 0xB9, 0x40, 0x00, 0xA2, 0x13, 0x00, 0xFD, 0xCF, 0x12, 0x00, 0x01, 0xFF];


        // const hexString =  [ 0x09, 0x00, 0x28, 0x00, 0x0F, 0x3B, 0x9A, 0x00, 0x3B, 0x9A, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00 ,0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00 ,0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00]



        const buffer = new Buffer(buffer1);


        // 10101111001100001011
        //console.log(hexToBinary(hexString));

        // const bytes = [64, 9, 33, 251, 84, 68, 45, 24];
        // const toto = endianness(bytes, 8);
        const header = XbeeHelper.routingTable(buffer);


        return {};
    }

    public static routingTable(buffer) {
        XbeeHelper.position = 0;
        const item: { [s: string]: number | string } = {};
        item['id'] = XbeeHelper.readUInt8(buffer);
        item['status'] = XbeeHelper.readUInt8(buffer);
        item['routingtableentries'] = XbeeHelper.readUInt8(buffer);
        item['startindex'] = XbeeHelper.readUInt8(buffer);
        item['routingtablelistcount'] = XbeeHelper.readUInt8(buffer);
        item['routingtablelist'] = XbeeHelper.readListRoutingTable(buffer, Number(item['routingtablelistcount']));

        return item;
    }

    public static lqiTable(buffer) {
        XbeeHelper.position = 0;
        const item: { [s: string]: number | string } = {};

        item['id'] = XbeeHelper.readUInt8(buffer);
        item['status'] = XbeeHelper.readUInt8(buffer);
        item['neighbortableentries'] = XbeeHelper.readUInt8(buffer);
        item['startindex'] = XbeeHelper.readUInt8(buffer);
        item['neighborlqilistcount'] = XbeeHelper.readUInt8(buffer);
        item['neighborlqilist'] = XbeeHelper.readListNeighborLqi(buffer, Number(item['neighborlqilistcount']));

        return item;
    }

    private static readListNeighborLqi(buffer: any, length: number): any {
        const value = [];
        const lqiLstLength = length;
        for (let i = 0; i < lqiLstLength; i++) {
            const item: { [s: string]: number | string } = {};

            item['extPandId'] = XbeeHelper.readIeeeAddr(buffer);
            item['extAddr'] = XbeeHelper.readIeeeAddr(buffer);
            item['nwkAddr'] = XbeeHelper.readUInt16(buffer);

            const value1 = XbeeHelper.readUInt8(buffer);
            item['deviceType'] = value1 & 0x03;
            item['rxOnWhenIdle'] = (value1 & 0x0C) >> 2;
            item['relationship'] = (value1 & 0x70) >> 4;

            item['permitJoin'] = XbeeHelper.readUInt8(buffer) & 0x03;
            item['depth'] = XbeeHelper.readUInt8(buffer);
            item['lqi'] = XbeeHelper.readUInt8(buffer);

            value.push(item);
        }

        return value;
    }



    private static readListRoutingTable(buffer: any, length: number): any {
        const value = [];
        const routingLstLength = length;

        const statusLookup: { [n: number]: string } = {
            0: 'ACTIVE',
            1: 'DISCOVERY_UNDERWAY',
            2: 'DISCOVERY_FAILED',
            3: 'INACTIVE'
        };

        for (let i = 0; i < routingLstLength; i++) {
            const item: { [s: string]: number | string } = {};
            item['destNwkAddr'] = this.readUInt16(buffer);
            item['routeStatus'] = statusLookup[this.readUInt8(buffer)];
            item['nextHopNwkAddr'] = this.readUInt16(buffer);
            value.push(item);
        }

        return value;
    }

    private static readIeeeAddr(buffer): any {
        const length = 8;
        const value = buffer.slice(this.position, this.position + length);
        this.position += length;

        return this.addressBufferToString(value);
    }

    private static readUInt16(buffer): any {
        const value = buffer.readUInt16LE(this.position);
        this.position += 2;
        return value;
    }

    private static readUInt8(buffer): any {
        const value = buffer.readUInt8(this.position);
        this.position++;
        return value;
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
