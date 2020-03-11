import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ModuleService } from '../services/module.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as pump from "pump";
import * as fs from "fs";
import { SchemeQueryDto } from '../dto/scheme.query.dto';
import { Observable } from 'rxjs';
import { SchemeService } from '../services/scheme.service';
import { SchemeDto } from '../dto/scheme.dto';
import { SectorService } from '../services/sector.service';
import { SectorDto } from '../dto/sector.dto';
import { SectorQueryDto } from '../dto/sector.query.dto';

@Controller('sector')
export class SectorController {
    constructor(private readonly sectorService: SectorService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) sectorQueryDto: SectorQueryDto): Observable<boolean> {
        return this.sectorService.getAll(sectorQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.sectorService.get(id);
    }

    @Delete('/:sectorId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('sectorId') sectorId: string): Observable<boolean> {
        return this.sectorService.delete(sectorId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() sectorDto: SectorDto): Observable<any> {
        return this.sectorService.update(sectorDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() sectorDto: SectorDto): Observable<any> {
        return this.sectorService.add(sectorDto);
    }

}
