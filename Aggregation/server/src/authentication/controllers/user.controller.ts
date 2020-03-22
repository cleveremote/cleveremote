import { Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { UserDto } from '../dto/user.dto';
import { UserQueryDto } from '../dto/user.query.dto';
import { UserService } from '../services/user.service';

@Controller('api/user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) userQueryDto: UserQueryDto): Observable<boolean> {
        return this.userService.getAll(userQueryDto);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.userService.get(id);
    }

    @Delete('/:userId')
    // @SetMetadata('roles', ['readwrite'])
    @UsePipes(ValidationPipe)
    public deleteModule(@Param('userId') moduleId: string): Observable<boolean> {
        return this.userService.delete(moduleId);
    }

    @UsePipes(ValidationPipe)
    @Put()
    public update(@Body() userDto: UserDto): Observable<any> {
        return this.userService.update(userDto);
    }

    @UsePipes(new ValidationPipe())
    @Post()
    public add(@Body() userDto: UserDto): Observable<any> {
        return this.userService.add(userDto);
    }

}
