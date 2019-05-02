import { Request, Response, NextFunction } from "express";
import Passport from "../config/passport";
import { IUser } from "../entities/interfaces/entities.interface";
import * as jwt from 'jsonwebtoken';

export function authenticate() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target["__" + propertyKey + "Middleware"]) {
            target["__" + propertyKey + "Middleware"] = [];
        }
        target["__" + propertyKey + "Middleware"].push(
            (request: Request, response: Response, next: NextFunction) => {

                Passport.passport.authenticate('local-login', { session: false }, (err: any, user: any, info: any) => {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        return response.send({ success: false, message: 'login failed' });
                    }
                    console.log('Secret is: ', process.env.JWT_SECRET);
                    const t = <IUser>JSON.parse(JSON.stringify(user));
                    const token = jwt.sign(t,
                        String(process.env.JWT_SECRET),
                        { expiresIn: 3600 }
                    );
                    response.locals = { authentication: { success: true, user, token, expiresIn: 3600 } };
                    return next();
                })(request, response);
            }
        );
    };
}

export function isAuthenticated() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target["__" + propertyKey + "Middleware"]) {
            target["__" + propertyKey + "Middleware"] = [];
        }
        target["__" + propertyKey + "Middleware"].push(
            (request: Request, response: Response, next: NextFunction) => {
                Passport.passport.authenticate('jwt', { session: false })(request, response, next);
            }
        );
    };
}

class Autentication { }

export default Autentication;