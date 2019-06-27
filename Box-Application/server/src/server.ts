
import { Observable, of as observableOf, from as observableFrom, EMPTY, of } from 'rxjs';
import { tap, flatMap, map } from 'rxjs/operators';

import { ormConnection } from './entities';
import { Router } from './router';
// import { RedisClient, createClient } from 'redis';
// import * as connectRedis from 'connect-redis';

import { PassportService } from './services/passport.service';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import * as session from 'express-session';
import * as logger from 'morgan';
import * as passportType from "passport";
import * as mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';
import { KafkaService } from './services/kafka.service';
import { XbeeService } from './services/xbee.service';
import { Tools } from './services/tools-service';
import { DispatchService } from './services/dispatch.service';

export class Server {

    public app: express.Application;

    constructor() {
        this.app = express();
    }

    public init(): Observable<express.Application> {
        process.on('uncaughtException', (err) => {
            console.log('whoops! there was an error', err.stack);
        });
        return Tools.getSerialNumber().pipe(
            flatMap(() => this.initDependencies().pipe(
                flatMap(() => this.initDb().pipe(
                    flatMap(() => this.initKafka().pipe(
                        flatMap(() => this.initDispatch().pipe(
                            flatMap(() => this.initXbee().pipe(
                                flatMap(() => this.initPassport().pipe(
                                    flatMap(() => this.initDbMongoose().pipe(
                                        flatMap(() => this.initRoutes()), map(() => this.app))
                                    ))
                                ))
                            ))
                        ))
                    ))
                ))
            ));
    }

    public initDispatch(): Observable<void> {
        Tools.loginfo('* start init dispatch...');
        const dispatchService = new DispatchService();

        return dispatchService.init();
    }

    public initDb(): Observable<void> {
        Tools.loginfo('* start init db...');

        return observableFrom(ormConnection).pipe(
            map(() => {
                Tools.logSuccess('  => OK.');
            }, (err: any) => {
                Tools.logError(`  => KO! ${err}`);

                return err;
            }));
    }

    public initKafka(): Observable<void> {
        Tools.loginfo('* start init kafka...');
        const kafkaInstance = new KafkaService();

        return kafkaInstance.init();
    }

    public initXbee(): Observable<void> {
        Tools.loginfo('* start init xbee...');
        const xbee = new XbeeService();

        return xbee.init();
    }

    public initDbMongoose(): Observable<void> {
        Tools.loginfo('* start init mongoDB...');
        // tslint:disable-next-line:max-line-length
        const db = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

        return observableOf(
            mongoose.connect(db, {
                useMongoClient: true,
                promiseLibrary: global.Promise
            })
        ).pipe(map(
            (x: any) => {
                Tools.logSuccess('  => OK.');
                (mongoose as any).Promise = Promise;
            }, (err: any) => {
                Tools.logError(`  => KO! ${err}`);

                return err;
            }
        ));
    }

    public initDependencies(): Observable<void> {
        Tools.loginfo('* start init dependencies...');
        // const redisStore = connectRedis(session);
        // const redisClient: RedisClient = createClient();

        return observableOf(true).pipe(
            map(() => {
                this.app.use(express.static('public'));
                this.app.use(express.static('files'));
                this.app.use(logger('dev'));
                this.app.use(cookieParser());
                this.app.use(bodyParser.urlencoded({ extended: true }));
                this.app.use(bodyParser.json());
                this.app.use(session({
                    secret: String(process.env.JWT_SECRET),
                    resave: true,
                    saveUninitialized: true,
                    // store: new redisStore({ host: '192.168.1.30', port: 6379, client: redisClient, ttl: 86400 }),
                    cookie: {
                        secure: false
                    }
                }));

                // redisClient.on('error', (err: any) => {
                //     this.loginfo('Redis error: ', err);
                // });

                this.app.set('port', process.env.PORT);
                Tools.logSuccess('  => OK');
            }));
    }

    public initRoutes(): Observable<void> {
        Tools.loginfo('* start init routes...');

        return observableFrom(Router.getRouter()).pipe(
            map((router: express.Router) => {
                Tools.logSuccess('  => OK.');
                this.app.use('', router);
                this.app.use('/api/', router);
            }, (err: any) => {
                Tools.logError(`  => KO! ${err}`);

                return err;
            }));
    }

    public initPassport(): Observable<void> {
        Tools.loginfo('* start init passport...');

        return observableFrom(PassportService.init()).pipe(
            map((passport: passportType.PassportStatic) => {
                Tools.logSuccess('  => OK.');
                this.app.use(passport.initialize());
                this.app.use(passport.session());
            }, (err: any) => {
                Tools.logError(`  => KO! ${err}`);

                return err;
            }));
    }

}
