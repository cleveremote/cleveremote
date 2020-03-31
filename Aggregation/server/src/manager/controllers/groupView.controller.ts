import { UseGuards, Controller, Get, Query, ValidationPipe, Param, UsePipes, Put, Body, Post, Request } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { GroupViewService } from '../services/groupView.service';

@Controller('groupview')
export class GroupViewController {
    constructor(private readonly groupViewService: GroupViewService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) groupViewQueryDto: any): Observable<boolean> {
        return this.groupViewService.getAll(groupViewQueryDto);
    }


    @Post('/:goupId')
    // @SetMetadata('roles', ['readwrite'])
    @UseGuards(AuthGuard('jwt'))
    @UsePipes(ValidationPipe)
    public deleteGroupView(@Request() req, @Body() modules: Array<string>, @Param('goupId') groupId: string): Observable<boolean> {
        return this.groupViewService.removeFromGroup(modules, groupId, req);
    }

    @UsePipes(ValidationPipe)
    @Put('/:goupId')
    @UseGuards(AuthGuard('jwt'))
    public addToGroup(@Request() req, @Body() modules: Array<string>, @Param('goupId') groupId: string): Observable<any> {
        return this.groupViewService.saveToGroup(modules, groupId, req);
    }

    @UsePipes(ValidationPipe)
    @Post()
    public add(@Body() groupViewDto: any): Observable<any> {
        return this.groupViewService.addGroup(groupViewDto);
    }




}
