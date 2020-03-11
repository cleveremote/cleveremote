import { LogMongoEntity, log } from "../entities/log.mongo.entity";
import { observable, from, of, Observable } from "rxjs";
import { tap, mergeMap } from "rxjs/operators";

export class MongoService {

    public static getLogs(): Observable<Array<LogMongoEntity>> {
        const promise = log.find().exec();

        return from(promise);
    }

    public static createLogs(data: LogMongoEntity): Observable<LogMongoEntity> {
        const promise = log.create(data);

        return from(promise);
    }
}
