import { UserModule } from '../api/models/userModel';
import * as moment from 'moment';
import { tap, flatMap, map } from 'rxjs/operators';
import { Observable, of as observableOf, from as observableFrom } from 'rxjs';

import { UserExt } from '../entities/custom.repositories/user.ext';
import { getRepository, getCustomRepository } from 'typeorm';

import * as passport from "passport";

import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt as ExtractJWT } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export class PassportService {

    public static passport: passport.PassportStatic;

    public static init(): Observable<passport.PassportStatic> {
        PassportService.passport = passport;

        return PassportService.initDependencies().pipe(
            map(() => PassportService.passport));
    }

    public static initDependencies(): Observable<boolean> {
        return observableOf(true).pipe(
            tap(() => {
                PassportService.passport.serializeUser((user: any, done: any) => {
                    done(undefined, user.id);
                });

                PassportService.passport.deserializeUser((id: any, done: any) => {
                    UserModule.findById(id, (err: any, user: any) => {
                        done(err, user);
                    });
                });

                PassportService.passport.use('local-signup', new LocalStrategy({
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true
                },
                    (req: any, email: any, password: any, done: any) => {
                        process.nextTick(() => {
                            UserModule.findOne({ 'local.email': email }, (err: any, user: any) => {
                                if (err) {
                                    return done(err);
                                }
                                if (user) {
                                    return done(undefined, false, undefined);
                                }
                                const newUser = new UserModule();
                                newUser.local.email = email;
                                newUser.local.password = newUser.generateHash(password);
                                newUser.save((err2: any) => {
                                    if (err2) {
                                        throw err2;
                                    }

                                    return done(undefined, newUser);
                                });
                            });
                        });
                    }));

                PassportService.passport.use('local-login', new LocalStrategy({
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true
                },
                    (req: any, email: any, password: any, done: any) => {
                        const userRepository = getCustomRepository(UserExt);
                        userRepository.authenticate(req, email, password, done);
                    }));

                PassportService.passport.use('jwt', new JWTStrategy({
                    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
                    secretOrKey: String(process.env.JWT_SECRET)
                },
                    (jwtPayload: any, done: any, req: any) => {
                        const userRepository = getCustomRepository(UserExt);
                        userRepository.getUser(jwtPayload.user_id, done);
                    }
                ));

                PassportService.passport.use(new GoogleStrategy({
                    clientID: "940995958052-0kb6df6obe0shlcasd5ibl0f6qcdqjpo.apps.googleusercontent.com",
                    clientSecret: "ZBhopSvoHFrHTVoyC4DJm5j-",
                    callbackURL: "http://192.168.1.30:4200/api/auth/google/callback"
                },
                    (accessToken: any, refreshToken: any, params: any, profile: any, done: any) => {
                        process.nextTick(() => {
                            UserModule.findOne({ 'google.id': profile.id }, (err: any, user: any) => {
                                if (err) {
                                    return done(err, user);
                                }
                                if (user) {
                                    console.log(profile);

                                    return done(err, user);
                                }
                                const newUser = new UserModule();

                                newUser.google.id = profile.id;
                                newUser.google.token = accessToken;
                                newUser.google.email = profile.emails[0].value;
                                newUser.google.name = `${profile.name.familyName} ${profile.name.givenName}`;
                                newUser.google.expiresIn = 3600;
                                newUser.save((err2: any) => {
                                    if (err2) {
                                        throw err2;
                                    }

                                    return done(err, user);
                                });
                            });
                        });
                    }));
            }));
    }

}
