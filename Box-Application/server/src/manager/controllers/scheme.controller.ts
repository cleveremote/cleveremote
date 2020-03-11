import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ModuleService } from '../services/module.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as pump from "pump";
import * as fs from "fs";
import { SchemeQueryDto } from '../dto/scheme.query.dto';
import { Observable } from 'rxjs';
import { SchemeService } from '../services/scheme.service';
import { SchemeDto } from '../dto/scheme.dto';

@Controller('scheme')
export class SchemeController {
    constructor(private readonly schemeService: SchemeService) { }

    // @Post('upload') comming soon 
    // @UseInterceptors(FileInterceptor('file'))
    // public uploadFile(@UploadedFile() file): void {
    //     console.log(file);
    // }


    @Get('all')
    public getAll(@Query(ValidationPipe) moduleQueryDto: SchemeQueryDto): Observable<boolean> {
        return this.schemeService.getAll(moduleQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.schemeService.get(id);
    }

    @Delete('/:moduleId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('moduleId') moduleId: string): Observable<boolean> {
        return this.schemeService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() schemeDto: SchemeDto): Observable<any> {
        return this.schemeService.update(schemeDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() schemeDto: SchemeDto): Observable<any> {
        return this.schemeService.add(schemeDto);
    }

    @Post('upload')
    public upload(@Req() req, @Res() reply): void {
        const mp = req.multipart((field, file, filename, encoding, mimetype) => {
            pump(file, fs.createWriteStream('fileNadime')) //File path
            const t = 2;
        }, (err: any) => {
            console.log('upload completed');
            reply.code(200).send();
        });
    }

}
