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

    public executeModule(): any {
        // on/off/get
        return {};
    }

    public configureModule(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...
        return {};
    }
}
