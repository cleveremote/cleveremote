import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, Header } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { TransceiverService } from '../services/transceiver.service';
import { TransceiverDto } from '../dto/transceiver.dto';
import { TransceiverQueryDto } from '../dto/transceiver.query.dto';
import { XbeeService } from '../../xbee/services/xbee.service';

@Controller('transceiver')
export class TransceiverController {
    constructor(
        private readonly transceiverService: TransceiverService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) transceiverQueryDto: TransceiverQueryDto): Observable<boolean> {
        return this.transceiverService.getAll(transceiverQueryDto);
    }

    // @Get(':transceiverId')
    // // @SetMetadata('roles', ['readonly', 'readwrite'])
    // @UsePipes(ValidationPipe)
    // public get(@Param('transceiverId') transceiverId: string): Observable<boolean> {
    //     return this.transceiverService.get(transceiverId);
    // }

    @Delete()
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Body() transceiverIds: Array<string>, @Param('transceiverId') transceiverId: string): Observable<boolean> {
        return this.transceiverService.delete(transceiverIds);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() transceiverDto: TransceiverDto): Observable<any> {
        return this.transceiverService.save(transceiverDto[0], false, false);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() transceiverDto: TransceiverDto): Observable<any> {
        return this.transceiverService.add(transceiverDto);
    }

}
