import { ILog, log } from "../entities/mongo.entities/logs";
import { observable, from, of, Observable } from "rxjs";
import { tap, mergeMap } from "rxjs/operators";

export class MongoService {

    public static getLogs(): Observable<Array<ILog>> {
        const promise = log.find().exec();

        return from(promise);
    }

    public static createLogs(data: ILog): Observable<ILog> {

        const promise = log.create(data);

        return from(promise);
    }
}
