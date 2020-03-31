import { Controller, Get, Query, ValidationPipe, Param, UsePipes, Delete, Put, Body, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DeviceService } from '../services/device.service';
import { DeviceQueryDto } from '../dto/device.query.dto';
import { DeviceDto } from '../dto/device.dto';

@Controller('device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) deviceQueryDto: DeviceQueryDto): Observable<boolean> {
        return this.deviceService.getAll(deviceQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.deviceService.get(id);
    }

    @Delete('/:deviceId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('deviceId') moduleId: string): Observable<boolean> {
        return this.deviceService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() deviceDto: DeviceDto): Observable<any> {
        return this.deviceService.update(deviceDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() deviceDto: DeviceDto): Observable<any> {
        return this.deviceService.add(deviceDto);
    }

   


}
