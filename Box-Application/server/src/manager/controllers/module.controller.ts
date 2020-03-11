import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ModuleService } from '../services/module.service';
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';

@Controller('module')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) moduleQueryDto: ModuleQueryDto): Observable<boolean> {
        return this.moduleService.getAll(moduleQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.moduleService.get(id);
    }

    @Delete('/:moduleId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('moduleId') moduleId: string): Observable<boolean> {
        return this.moduleService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() moduleDto: ModuleDto): Observable<any> {
        return this.moduleService.update(moduleDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() moduleDto: ModuleDto): Observable<any> {
        return this.moduleService.add(moduleDto);
    }

}
