import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { DeviceService } from './device.service';

export class ModuleService extends DeviceService {

    public add(module: any): any {
        return {};
    }

    public update(module: any): any {
        return {};
    }

    public delete(id: number): any {
        return {};
    }

    public switchDigital(port: string, value: boolean, address: string): Observable<any> {
        return this.xbee.remoteCommand({
            command: port,
            commandParameter: [value ? 5 : 4],
            destination64: address// '0013a20040b971f3'
        }).pipe(map((response: any) => response));
    }

    public configureModule(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...
        return {};
    }
}
