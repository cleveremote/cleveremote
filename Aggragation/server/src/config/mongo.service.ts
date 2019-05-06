import Log, { ILog } from "../entities/mongo.entities/logs";
import { observable, from, of, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { mergeMap } from "rxjs-compat/operator/mergeMap";

class MongoService {

    public static getLogs():Observable<ILog[]> {
        const promise = Log.find().exec(); 
        return from(promise);
    }

    public static createLogs():Observable<ILog>{
      
        const logData :ILog = <ILog>{source: "string",
            module: "string",
            value: "string",
            date: new Date()
        };
        
        var log = new Log(logData);

        const promise  = log.save();
        return from(promise);
    }


}
export default MongoService;