import { Request, Response, NextFunction } from "express";
import { PassportService } from "../services/passport.service";
import { IUser } from "../entities/interfaces/entities.interface";
import * as jwt from 'jsonwebtoken';

export const authenticate = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!target[`__${propertyKey}Middleware`]) {
        target[`__${propertyKey}Middleware`] = [];
    }
    target[`__${propertyKey}Middleware`].push(
        (request: Request, response: Response, next: NextFunction) => {
            PassportService.passport.authenticate('local-login', { session: false }, (err: any, user: any, info: any) => {
                if (err) {
                    next(err);

                    return;
                }
                if (!user) {
                    return response.send({ success: false, message: 'login failed' });
                }
                console.log('Secret is: ', process.env.JWT_SECRET);
                const t = JSON.parse(JSON.stringify(user)) as IUser;
                const token = jwt.sign(t,
                    String(process.env.JWT_SECRET),
                    { expiresIn: 3600 }
                );
                response.locals = { authentication: { success: true, user, token, expiresIn: 3600 } };
                next();

                return;
            })(request, response);
        });
};

export const isAuthenticated = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!target[`__${propertyKey}Middleware`]) {
        target[`__${propertyKey}Middleware`] = [];
    }
    target[`__${propertyKey}Middleware`].push(
        (request: Request, response: Response, next: NextFunction) => {
            PassportService.passport.authenticate('jwt', { session: false })(request, response, next);
        }
    );
};
