import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService, Provider } from "../services/auth.service";


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google')
{

    constructor(
        private readonly authService: AuthService
    ) {
        super({
            passReqToCallback: true,
            scope: ['profile', 'email'],
            clientID: "940995958052-0kb6df6obe0shlcasd5ibl0f6qcdqjpo.apps.googleusercontent.com",
            clientSecret: "ZBhopSvoHFrHTVoyC4DJm5j-",
            callbackURL: "http://localhost:4200/api/authentication/google/callback"
        })
    }


    async validate(request: any, accessToken: string, refreshToken: string, profile, done: Function) {
        try {
            console.log(profile);

            const jwt: string = await this.authService.validateOAuthLogin(profile, Provider.GOOGLE);
            const user =
            {
                jwt
            }

            done(null, user);
        }
        catch (err) {
            // console.log(err)
            done(err, false);
        }
    }

}