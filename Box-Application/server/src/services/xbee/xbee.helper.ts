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
    public position = 0;
    public testFunction(): any {
        const hexString = [0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82, 0x49, 0xC0, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00, 0x34, 0x02, 0x00, 0xFE, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF3, 0x71, 0xB9, 0x40, 0x00, 0xA2, 0x13, 0x00, 0xFD, 0xCF, 0x12, 0x00, 0x01, 0xFF];



const buffer = new Buffer(hexString);


        // 10101111001100001011
        //console.log(hexToBinary(hexString));

        // const bytes = [64, 9, 33, 251, 84, 68, 45, 24];
        // const toto = endianness(bytes, 8);

        const test = this.readListNeighborLqi(buffer);

        return {};
    }

    private readListNeighborLqi(buffer: any): any {
        const value = [];
        for (let i = 0; i < 2; i++) {
            const item: { [s: string]: number | string } = {};

            item['extPandId'] = this.readIeeeAddr(buffer);
            item['extAddr'] = this.readIeeeAddr(buffer);
            item['nwkAddr'] = this.readUInt16(buffer);

            const value1 = this.readUInt8(buffer);
            item['deviceType'] = value1 & 0x03;
            item['rxOnWhenIdle'] = (value1 & 0x0C) >> 2;
            item['relationship'] = (value1 & 0x70) >> 4;

            item['permitJoin'] = this.readUInt8(buffer) & 0x03;
            item['depth'] = this.readUInt8(buffer);
            item['lqi'] = this.readUInt8(buffer);

            value.push(item);
        }

        return value;
    }

    private readIeeeAddr(buffer): any {
        const length = 8;
        const value = buffer.slice(this.position, this.position + length);
        this.position += length;

        return this.addressBufferToString(value);
    }

    private readUInt16(buffer): any {
        const value = buffer.readUInt16LE(this.position);
        this.position += 2;
        return value;
    }

    private readUInt8(buffer): any {
        const value = buffer.readUInt8(this.position);
        this.position++;
        return value;
    }



    private addressBufferToString(buffer: Buffer): string {
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
