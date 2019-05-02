import {UserModule} from '../api/models/userModel';
import moment = require('moment');
import * as passport from "passport";
import { tap, flatMap, map } from 'rxjs/operators';
import { Observable, of as observableOf, from as observableFrom } from 'rxjs';

import { userExt } from '../entities/custom.repositories/userExt';
import { getRepository, getCustomRepository } from 'typeorm';

const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const passportGoogle = require('passport-google-oauth20');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const GoogleStrategy = passportGoogle.Strategy;


class Passport {

    public static passport: passport.PassportStatic;

    constructor() {
        // this.passport = express();
    }

    public static init(): Observable<passport.PassportStatic> {
        this.passport = passport;
        return this.initDependencies().pipe(
            map(() =>  this.passport));
    }

    public static initDependencies(): Observable<boolean> {
        

        return observableOf(true).pipe(
            tap(() => {
                this.passport.serializeUser((user: any, done: any) => {
                    done(null, user.id);
                });

                this.passport.deserializeUser((id: any, done: any) => {
                    UserModule.findById(id, (err: any, user: any) => {
                        done(err, user);
                    });
                });

                this.passport.use('local-signup', new LocalStrategy({
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true,
                },
                (req: any, email: any, password: any, done: any) => {
                    process.nextTick(() => {
                        UserModule.findOne({'local.email': email}, (err: any, user: any) => {
                            if (err) {
                                return done(err);
                            }
                            if (user) {
                                return done(null, false, null);
                            } else {
                                const newUser = new UserModule();
                                newUser.local.email = email;
                                newUser.local.password = newUser.generateHash(password);
                                newUser.save((err2: any) => {
                                    if (err2) {
                                        throw err2;
                                    }
                                    return done(null, newUser);
                                });
                            }
        
                        });
        
                    });
        
                }));
        
            /**
             * LOCAL LOGIN
             * we are using named strategies since we have one for login and one for signup
             * by default, if there was no name, it would just be called 'local'
             * */
            this.passport.use('local-login', new LocalStrategy({
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true,
                },
                (req: any, email: any, password: any, done: any) => { 
                    const userRepository= getCustomRepository(userExt);
                    userRepository.authenticate(req, email, password, done);
                }));
        
            /**
             * JWT STRATEGY
             * to verify the validity of json web token
             * */
            this.passport.use('jwt', new JWTStrategy({
                    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
                    secretOrKey: String(process.env.JWT_SECRET),
                },
                (jwtPayload: any, done: any, req: any) => {
                    const userRepository= getCustomRepository(userExt);
                    userRepository.getUser(jwtPayload.user_id,done);
                },
            ));
        
            
        
            this.passport.use(new GoogleStrategy({
                clientID: "940995958052-0kb6df6obe0shlcasd5ibl0f6qcdqjpo.apps.googleusercontent.com",
                clientSecret: "ZBhopSvoHFrHTVoyC4DJm5j-",
                callbackURL: "http://192.168.1.30:4200/api/auth/google/callback"
              },
              (access_token:any, refreshToken:any, params:any, profile:any, done:any) => {
                    process.nextTick(() => {
                        UserModule.findOne({'google.id': profile.id}, (err: any, user: any) => {
                            if (err) {
                                return done(err, user);
                            }
                            if (user) {
                                console.log(profile);
                                return done(err, user);
                            } else {
                                const newUser = new UserModule();
                                
                                newUser.google.id= profile.id;
                                newUser.google.token= access_token;
                                newUser.google.email=  profile.emails[0].value;
                                newUser.google.name = profile.name.familyName + " " + profile.name.givenName;
                                newUser.google.expiresIn = 3600;
                                newUser.save((err2: any) => {
                                    if (err2) {
                                        throw err2;
                                    }
                                    return done(err, user);
                                });
                            }
                        });
                    });
              }
            ));

            }));
    } 

}
export default Passport;
