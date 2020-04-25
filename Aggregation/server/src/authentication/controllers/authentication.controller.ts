import { UseGuards, Controller, Get, Query, Res, ValidationPipe, Param, UsePipes, ParseIntPipe, Delete, Put, Body, Post, Request, Req, Response } from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';

@Controller('authentication')
export class AuthenticationController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(AuthGuard())
    @Get('token')
    public getToken(@Req() request): Observable<any> {
        const user = JSON.parse(JSON.stringify(request.user));
        const token = jwt.sign({ data: user },
            String(process.env.JWT_SECRET),
            { expiresIn: 200000 }
        );
        return of({ success: true, user, token, expiresIn: 200000 });
    }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    public login(@Request() req): Observable<any> {
        return of(this.authService.login(req.user));
    }

    @Get('googleLinkAccount')
    @UseGuards(AuthGuard('googleLinkAccount'))
    public googleLoginAccount(@Res() res: any): void {
        // initiates the Google OAuth2 login flow
    }

    @Get('google')
    @UseGuards(AuthGuard('googleLinkAccount'))
    public googleLogin(@Res() res: any): void {
        // initiates the Google OAuth2 login flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    public googleLoginCallback(@Req() req: any, @Res() res: any): void {
        // handles the Google OAuth2 callback
        const jwtToken: string = req.user.jwt;
        if (jwtToken) {
            res.redirect('http://localhost:4200/scheme/' + jwtToken);
        } else {
            res.redirect('http://localhost:4200/login/failure');
        }

    }

    @Get('google/callbacklink')
    @UseGuards(AuthGuard('googleLinkAccount'))
    public googleLoginCallbackLink(@Req() req: any, @Res() res: any): void {
        let responseHTML = '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>';

        req.user.data.devices = req.user.data.account.devices.map(x => ({ id: x.id, status: false }));
        delete req.user.data.account;
        responseHTML = responseHTML.replace('%value%', JSON.stringify({
            user: req.user
        }));
        res.status(200).send(responseHTML);
    }

    @Get('protected')
    @UseGuards(AuthGuard('jwt'))
    public protectedResource(): string {
        return 'JWT is working!';
    }

}
