import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderExt } from '../repositories/provider.ext';
import { ProvideryDto } from '../dto/provider.dto';
import { ProviderQueryDto } from '../dto/provider.query.dto';

export class ProviderService {

    constructor(
        @InjectRepository(ProviderExt) private readonly providerRepository: ProviderExt
    ) { }

    public get(id: string): Observable<any> {
        console.log("caller is " + (this.get as any ).callee.caller);
        return this.providerRepository.getProvider(id);
    }

    public add(providerDto: ProvideryDto): Observable<any> {
        return this.providerRepository.addProvider(providerDto);
    }

    public update(providerDto: ProvideryDto): Observable<any> {
        return this.providerRepository.updateProvider(providerDto);
    }

    public delete(id: string): Observable<any> {
        return this.providerRepository.deleteProvider(id);
    }

    public getAll(providerQueryDto: ProviderQueryDto): Observable<any> {
        return this.providerRepository.getAll(providerQueryDto);
    }
}
