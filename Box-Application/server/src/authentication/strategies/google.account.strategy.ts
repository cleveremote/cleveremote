import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService, Provider } from "../services/auth.service";
import { ProviderService } from "../services/provider.service";
import { mergeMap } from "rxjs/operators";
import { ProviderEntity } from "../entities/provider.entity";
import { of, Observable } from "rxjs";
import { AccountService } from "../services/account.service";


@Injectable()
export class GoogleAccountStrategy extends PassportStrategy(Strategy, 'googleLinkAccount')
{

    constructor(
        private readonly authService: AuthService
    ) {
        super({
            passReqToCallback: true,
            scope: ['profile', 'email'],
            clientID: "940995958052-0kb6df6obe0shlcasd5ibl0f6qcdqjpo.apps.googleusercontent.com",
            clientSecret: "ZBhopSvoHFrHTVoyC4DJm5j-",
            callbackURL: "http://www.cleveremote.com/api/authentication/google/callbackLink"
        })
    }


    async validate(request: any, accessToken: string, refreshToken: string, profile, done: Function) {
        try {
            const t = request;
            console.log(profile);



            const user: any = await this.authService.validateOAuthLogin(profile, Provider.GOOGLE)
            // const user =
            // {
            //     jwt
            // }

            done(null, user);
        }
        catch (err) {
            // console.log(err)
            done(err, false);
        }
    }



}