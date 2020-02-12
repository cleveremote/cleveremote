// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, Response } from 'express';
import { isAuthenticated } from '../../middleware/authentication';
// import { XbeeService } from '../../config/xbee';
import { MongoService } from '../../services/mongo.service';
import { map, mergeMap } from 'rxjs/operators';
import { ILog } from '../../entities/mongo.entities/logs';
import { KafkaService } from '../../services/kafka.service';
import { of } from 'rxjs';
import { AppError } from '../../errors/apperror.class';

// tslint:disable-next-line: no-default-export
export default class Execution extends Controller {

    public _params = ':device_id';

    @isAuthenticated()
    public post(req: Request, res: Response): void {
        const success = { source: 'OK', module: "string", value: "string", date: new Date() };
        const fail = { source: 'FAIL', module: "string", value: "string", date: new Date() };
        const dataExample = {
            entity: 'Account', type: 'UPDATE',
            data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
        };
        const payloads = [
            {
                topic: 'box_action',
                messages: JSON.stringify(dataExample), key: 'box_action.server_1'
            }
        ];
        let index = 1;
        KafkaService.instance.sendMessage(payloads).subscribe((x: any) => {
            const t = x;
            if (index <= 30 && x) {
                this.sendSuccess(res, success);
            } else if (index > 30 &&  !x) {
                this.sendSuccess(res, fail);
            }
            index++;
        });

        // XbeeService.GetNodeDiscovery().subscribe(function (frame) {
        //         console.log("Success!",frame);
        //     }, function (e) {
        //         console.log("Command failed:\n", e);
        //     });
        // const userCtrl = new UserController<Model<IUserModel>>(UserModule);
        // userCtrl.getAll(req, res);
        

        // MongoService.createLogs(toto as ILog).pipe(
        //     mergeMap(data => MongoService.getLogs().pipe(
        //         map(logs => logs)
        //     ))
        // ).subscribe((result: Array<ILog>) => {
        //     this.sendSuccess(res, toto);
        // });
        //this.sendSuccess(res, toto);
    }
}
