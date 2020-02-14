// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, Response } from 'express';
import { isAuthenticated } from '../../middleware/authentication';
// import { XbeeService } from '../../config/xbee';
import { MongoService } from '../../services/mongo.service';
import { map, mergeMap, retryWhen, tap, delayWhen, catchError } from 'rxjs/operators';
import { ILog } from '../../entities/mongo.entities/logs';
import { KafkaService } from '../../services/kafka.service';
import { of, interval, timer } from 'rxjs';
import { AppError } from '../../errors/apperror.class';
import { DispatchService } from '../../services/dispatch.service';
import { genericRetryStrategy } from '../../services/tools/generic-retry-strategy';

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
        KafkaService.instance.sendMessage(payloads).pipe(mergeMap((data: any) =>
            KafkaService.instance.checkReponseMessage(data).pipe(mergeMap((checkResponse: any) =>

                of(false).pipe(
                    map(val => {

                        const responseArray = KafkaService.instance.arrayOfResponse;
                        if (responseArray.length > 0) {

                            for (let index = 0; index < responseArray.length; index++) {
                                const element = responseArray[index];
                                const result = JSON.parse(element.value);
                                if (result.offset === checkResponse.oin) {
                                    responseArray.splice(index, 1);

                                    return { status: 'OK', message: "process success!" };
                                }
                            }
                        }
                        throw val;
                    }),
                    retryWhen(genericRetryStrategy({
                        durationBeforeRetry: 1000,
                        maxRetryAttempts: 8
                    })), catchError(error => error)
                )
            ))
        )).subscribe((x: any) => {
            if (x) {
                this.sendSuccess(res, x);
            }
        }
        );

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
