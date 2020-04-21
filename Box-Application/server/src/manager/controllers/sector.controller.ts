import { Controller, Get, Query, ValidationPipe, Param, UsePipes, Delete, Put, Body, Post, Request } from '@nestjs/common';
import { Observable } from 'rxjs';
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
    public update(@Request() req, @Body() sectorDto: SectorDto): Observable<any> {
        return this.sectorService.update(sectorDto, req);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() sectorDto: SectorDto): Observable<any> {
        return this.sectorService.add(sectorDto);
    }

}
