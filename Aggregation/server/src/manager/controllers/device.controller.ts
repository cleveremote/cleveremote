import { UseGuards, Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, Request, Req } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ModuleService } from '../services/module.service';
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';
import { AuthService } from '../../authentication';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from '../../authentication/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../../api/models/userModel';
import { WebSocketService } from '../../websocket/services/websocket.service';
import { tap } from 'rxjs/operators';
import { DeviceService } from '../services/device.service';
import { DeviceQueryDto } from '../dto/device.query.dto';
import { DeviceDto } from '../dto/device.dto';

@Controller('api/device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService, private readonly authService: AuthService) { }

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
