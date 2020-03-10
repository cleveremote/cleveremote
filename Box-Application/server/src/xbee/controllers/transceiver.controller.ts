import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, Header } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { TransceiverService } from '../services/transceiver.service';
import { TransceiverDto } from '../dto/transceiver.dto';

@Controller('transceiver')
export class TransceiverController {
    constructor(private readonly transceiverService: TransceiverService) { }

    @Get('allquery')
    public getAllQuery(): Observable<boolean> {
        return of(true);
    }

    @Get('all')
    public getAll(): Observable<boolean> {
        return this.transceiverService.getAll();
    }

    @Get(':id')
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.transceiverService.get(id);
    }

    @Delete(':id')
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('id') id: string): Observable<boolean> {
        return this.transceiverService.delete(id);
    }

    @UsePipes(ValidationPipe)
    @Put(':id')
    public update(@Param('id') id, @Body() transceiverDto: TransceiverDto): Observable<any> {
        return this.transceiverService.update(id, transceiverDto);
    }

    @Post('test')
    @Header('content-type', 'application/json')
    public add(@Body() transceiverDto: TransceiverDto): Observable<any> {
        return this.transceiverService.add(transceiverDto);
    }

    @UsePipes(new ValidationPipe())
    @Post(':id/generate-modules')
    public generateModule(): Observable<any> {
        return this.transceiverService.generateModules();
    }
}
