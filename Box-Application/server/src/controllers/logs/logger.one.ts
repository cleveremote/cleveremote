// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, Response } from 'express';
import { isAuthenticated } from '../../middleware/authentication';
// import { XbeeService } from '../../config/xbee';
import { MongoService } from '../../services/mongo.service';
import { map, mergeMap } from 'rxjs/operators';
import { ILog } from '../../entities/mongo.entities/logs';

// tslint:disable-next-line: no-default-export
export default class Logger extends Controller {

    public _params = ':device_id';

    @isAuthenticated()
    public get(req: Request, res: Response): void {
        // XbeeService.GetNodeDiscovery().subscribe(function (frame) {
        //         console.log("Success!",frame);
        //     }, function (e) {
        //         console.log("Command failed:\n", e);
        //     });
        // const userCtrl = new UserController<Model<IUserModel>>(UserModule);
        // userCtrl.getAll(req, res);
        const toto = { source: 'toto', module: "string", value: "string", date: new Date() };

        MongoService.createLogs(toto as ILog).pipe(
            mergeMap(data => MongoService.getLogs().pipe(
                map(logs => logs)
            ))
        ).subscribe((result: Array<ILog>) => {
            this.sendSuccess(res, result);
        });
    }
}
