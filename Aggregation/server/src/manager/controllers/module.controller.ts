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

@Controller('module')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService, private readonly authService: AuthService) { }

    @Get('all')
    public getAll(@Query(ValidationPipe) moduleQueryDto: ModuleQueryDto): Observable<boolean> {
        return this.moduleService.getAll(moduleQueryDto);
    }

    @Get('device/:deviceId')
    public getAllByDeviceId(@Param('deviceId') deviceId: string): Observable<boolean> {
        return this.moduleService.getAllByDeviceId(deviceId);
    }

    @Get('account/:accountId')
    public getAllByAccountId(@Param('accountId') accountId: string): Observable<boolean> {
        return this.moduleService.getAllByAccountId(accountId);
    }

    @Get(':id')
    // @SetMetadata('roles', ['readonly', 'readwrite'])
    @UsePipes(ValidationPipe)
    public get(@Param('id') id: string): Observable<boolean> {
        return this.moduleService.get(id);
    }

    @UseGuards(AuthGuard())
    @Get('token')
    public getToken(@Req() request): Observable<any> {
        const user = JSON.parse(JSON.stringify(request.user)) as IUser;
        const token = jwt.sign(user,
            String(process.env.JWT_SECRET),
            { expiresIn: 200000 }
        );
        return of({ success: true, user, token, expiresIn: 200000 });
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
    public add(@Body() moduleDto: any): Observable<any> {
        return this.moduleService.add(moduleDto);
    }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    public login(@Request() req): Observable<any> {
        return of(this.authService.login(req.user));
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    public googleLogin(): void {
        // initiates the Google OAuth2 login flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    public googleLoginCallback(@Req() req: any, @Res() res: any): void {
        // handles the Google OAuth2 callback
        const jwtToken: string = req.user.jwt;
        if (jwtToken) {
            res.redirect('http://localhost:4200/login/succes/' + jwtToken);
        } else {
            res.redirect('http://localhost:4200/login/failure');
        }

    }

    @Get('protected')
    @UseGuards(AuthGuard('jwt'))
    public protectedResource(): string {
        return 'JWT is working!';
    }

    // @Post('executiontest')
    // public executiontest(): Observable<any> {
    //     return this.moduleService.execution()
    //     .pipe(tap((result: any) => {
    //         WebSocketService.sendMessage('server_1', JSON.stringify(result));
    //     }));
    // }

    // @UseGuards(AuthGuard())
    // @Get('me')
    // getProfile(@Request() req) {
    //   return req.user;
    // }


}
