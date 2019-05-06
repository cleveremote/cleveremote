
import { of as observableOf, from as observableFrom } from 'rxjs';
import { tap, flatMap, map } from 'rxjs/operators';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import * as session from 'express-session';
import * as logger from 'morgan';
import * as passport from "passport";

import ormConnection from './entities';
import { Router } from './router';
import { Observable } from 'rxjs-compat';
import * as cors from "cors";
import { RedisClient, createClient } from 'redis';
import * as connectRedis from 'connect-redis';

import Passport from './config/passport';

import * as mongoose from 'mongoose';
import cookieParser = require('cookie-parser');


class Server {

    // set app to be of type express.Application
    public app: express.Application;

    constructor() {
        this.app = express();
    }

    public close(): void {
        // return this.app.close();
    }


    public init(): Observable<express.Application> {
        return this.initDependencies().pipe(
            flatMap(() => this.initDb().pipe(
                flatMap(() => this.initPassport().pipe(
                    flatMap(() => this.initDbMongoose().pipe(
                        flatMap(() => this.initRoutes()), map(() => this.app))))))));
    }

    public initDb(): Observable<void> {
        console.log('* start init db...');
        return observableFrom(
            // connection.sync({ force: true }))
            ormConnection).pipe(
                map(() => console.log('* init db OK.')),
                tap(null, (err) => {
                    console.error(`! init db KO ${err}`);
                    return err;
                }));
    }

    public initDbMongoose(): Observable<void> {
        console.log('* start init db...');
        const db: string = String((process.env.NODE_ENV === 'production') ? process.env.PROD_DB : process.env.DEV_DB);
        return observableOf(
            mongoose.connect(db, {
                useMongoClient: true,
                promiseLibrary: global.Promise,
            })

        ).pipe(map(() => console.log('* init db OK.')),
            tap((x: void) => { }, (err: any) => {
                console.error(`! init db KO ${err}`);
                return err;
            }));
    }

    public initDependencies(): Observable<void> {
        console.log('* start init dependencies...');
        const RedisStore = connectRedis(session);
        const redisClient: RedisClient = createClient();

        return observableOf(true).pipe(
            map(() => {
                this.app.use(express.static('public'));
                this.app.use(express.static('files'));
                this.app.use(logger('dev'));
                this.app.use(cookieParser());
                this.app.use(bodyParser());
                this.app.use(session({
                    secret: String(process.env.JWT_SECRET),
                    resave: true,
                    saveUninitialized: true,
                    store: new RedisStore({ host: '192.168.1.30', port: 6379, client: redisClient, ttl: 86400 }),
                    cookie: {
                        secure: false,
                    },
                }));

                redisClient.on('error', (err: any) => {
                    console.log('Redis error: ', err);
                });

                this.app.set('port', process.env.PORT);
            }));
    }

    public initRoutes(): Observable<void> {
        console.log('* start init routes...');
        return observableFrom(Router.getRouter()).pipe(
            map((router: express.Router) => {
                console.log('* init routes OK.');
                this.app.use('', router);
                this.app.use('/api/', router);
            }
            ),
            tap((x: void) => { }, (err: any) => {
                console.error(`! init routes KO ${err}`);
                return err;
            }));
    }

    public initPassport(): Observable<void> {
        console.log('* start init passport...');
        return observableFrom(Passport.init().pipe(
            map((passport: passport.PassportStatic) => {
                console.log('* init passport OK.');
                this.app.use(passport.initialize());
                this.app.use(passport.session());
            }),
            tap((x: void) => { }, (err: any) => {
                console.error(`! init passport KO ${err}`);
                return err;
            })));
    }

}

export default Server;