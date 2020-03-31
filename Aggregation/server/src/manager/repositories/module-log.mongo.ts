import * as mongoose from "mongoose";
import { from, Observable } from "rxjs";

export interface LogMongoEntity extends mongoose.Document {
    source: string;
    moduleId: string;
    userId: string;
    value: string;
    date: Date;
}

export class ModuleLogMongo {

    public static schema = new mongoose.Schema({
        source: { type: String, required: true },
        moduleId: { type: String, required: true },
        userId: { type: String, required: true },
        value: { type: String, required: true },
        date: { type: Date, required: true }
    });

    public static getLogs(): Observable<Array<LogMongoEntity>> {
        const promise = mongoose.model<LogMongoEntity>("ModuleLog", ModuleLogMongo.schema).find().exec();
        return from(promise);
    }

    public static getLastLog(moduleId: string): Observable<Array<LogMongoEntity>> {
        const promise = mongoose.model<LogMongoEntity>("ModuleLog", ModuleLogMongo.schema)
            .find({ moduleId: moduleId })
            .sort({ date: -1 }).limit(1) //--- 1 for asc and -1 for desc
            .exec();
        return from(promise);
    }

    public static createLogs(data: LogMongoEntity): Observable<LogMongoEntity> {
        const promise = mongoose.model<LogMongoEntity>("ModuleLog", ModuleLogMongo.schema).create(data);
        return from(promise);
    }

    public static getAllModule(ids: Array<string>): Observable<any> {
        const promise = mongoose.model<LogMongoEntity>("ModuleLog", ModuleLogMongo.schema)
            .aggregate([
                { $match: { moduleId: { $in: ids } } },
                {
                    $group: {
                        "_id": "$moduleId",
                        value: { $last: '$value' },
                        date: { $last: '$date' },
                        userId :{ $last: '$userId' },
                        source :{ $last: '$source' },
                        moduleId:{ $last: '$moduleId' },
                    }
                },
                {
                    $project:
                    {
                        moduleId: 1,
                        source: 1,
                        userId: 1,
                        date: 1,
                        value: 1
                    }
                },
                {
                    $sort: {
                        'date': -1
                    }
                }
            ])
            .exec();
        return from(promise);

    }

}
