import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchemeQueryDto } from '../dto/scheme.query.dto';
import { Observable, from } from 'rxjs';
import { SchemeService } from '../services/scheme.service';
import { SchemeDto } from '../dto/scheme.dto';
import { SectorService } from '../services/sector.service';
import { SectorEntity } from '../entities/sector.entity';

@Controller('sector')
export class SectorController {
    constructor(private readonly sectorService: SectorService) { }

    @Get(':id')
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.sectorService.get(id);
    }

    @UsePipes(new ValidationPipe())
    @Put()
    public execute(@Request() req, @Body() moduleDto: any): Observable<SectorEntity> {
        return this.sectorService.update(moduleDto, req);
    }

}
