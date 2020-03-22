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
import { UserExt } from '../repositories/user.ext';
import { UserQueryDto } from '../dto/user.query.dto';
import { UserDto } from '../dto/user.dto';

export class UserService {

    constructor(
       @InjectRepository(UserExt) private readonly userRepository: UserExt
    ) { }

    public get(id: string): Observable<any> {
        return this.userRepository.getUser(id);
    }

    public add(userDto: UserDto): Observable<any> {
        return this.userRepository.addUser(userDto);
    }

    public update(userDto: UserDto): Observable<any> {
        return this.userRepository.updateUser(userDto);
    }

    public delete(id: string): Observable<any> {
        return this.userRepository.deleteUser(id);
    }

    public getAll(userQueryDto: UserQueryDto): Observable<any> {
        return this.userRepository.getAll(userQueryDto);
    }
}
