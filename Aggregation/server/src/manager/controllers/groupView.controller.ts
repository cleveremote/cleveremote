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
import { GroupViewService } from '../services/groupView.service';

@Controller('api/groupview')
export class GroupViewController {
    constructor(private readonly groupViewService: GroupViewService, private readonly authService: AuthService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) groupViewQueryDto: any): Observable<boolean> {
        return this.groupViewService.getAll(groupViewQueryDto);
    }

    
    @Delete(':goupId/module/:moduleId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteGroupView(@Param('goupId') groupId: string,@Param('moduleId') moduleId: string): Observable<boolean> {
        return this.groupViewService.delete(groupId,moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() groupViewDto: any): Observable<any> {
        return this.groupViewService.saveGroup(groupViewDto);
    }

    @UsePipes(ValidationPipe)
    @Post()
    public add(@Body() groupViewDto: any): Observable<any> {
        return this.groupViewService.addGroup(groupViewDto);
    }

    


}
