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

    public testFunction(): any {
        const hexString = '13A20040C049820000000080310000017B0001000134120000000000007D49C04000A213003B9A35020F76';

        // 10101111001100001011
        console.log(hexToBinary(hexString));

        const bytes = [64, 9, 33, 251, 84, 68, 45, 24];
        const toto = endianness(bytes, 8);

        return {};
    }


}
