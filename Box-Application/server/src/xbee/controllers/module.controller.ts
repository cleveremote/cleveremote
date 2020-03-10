import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ModuleService } from '../services/module.service';
import { ModuleDto } from '../dto/module.dto';

@Controller('module')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService) { }

    @Get('allquery')
    public getAllQuery(): Observable<boolean> {
        return of(true);
    }

    @Get('all')
    public getAll(): Observable<boolean> {
        return this.moduleService.getAll();
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.moduleService.get(id);
    }

    @Delete(':id')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('id') id: string): Observable<boolean> {
        return this.moduleService.delete(id);
    }

    @UsePipes(ValidationPipe)
    @Put(':id')
    public update(@Param('id') id, @Body() moduleDto: ModuleDto): Observable<any> {
        return this.moduleService.update(id, moduleDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() moduleDto: ModuleDto): Observable<any> {
        return this.moduleService.add(moduleDto);
    }

}
