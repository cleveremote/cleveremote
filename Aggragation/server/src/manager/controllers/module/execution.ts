// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, Response } from 'express';
import { isAuthenticated } from '../../middleware/authentication';
// import { XbeeService } from '../../config/xbee';
import { MongoService } from '../../services/mongo.service';
import { map, mergeMap, retryWhen, tap, delayWhen, catchError } from 'rxjs/operators';
import { ILog } from '../../entities/logs';
import { KafkaService } from '../../../kafka/services/kafka.service';
import { of, interval, timer } from 'rxjs';
import { AppError } from '../../errors/apperror.class';
import { DispatchService } from '../../../dispatch/services/dispatch.service';
import { genericRetryStrategy } from '../../../common/generic-retry-strategy';
import { WebSocketService } from '../../services/websocket.service';
import { v1 } from 'uuid';

// tslint:disable-next-line: no-default-export
export default class Execution extends Controller {

    public _params = ':device_id';

    //@isAuthenticated()
    public post(req: Request, res: Response): void {
        const success = { source: 'OK', module: "string", value: "string", date: new Date() };
        const fail = { source: 'FAIL', module: "string", value: "string", date: new Date() };
        // const dataExample = {
        //     messageId: v1(),
        //     entity: 'Account', type: 'UPDATE',
        //     data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
        // };
        // const payloads = [
        //     {
        //         topic: 'box_action',
        //         messages: JSON.stringify(dataExample), key: 'box_action.server_1'
        //     }
        // ];

        const dataExample = {
            messageId: v1(),
            entity: 'Transceiver', action: 'UPDATE',
            data: {
                transceiverId: "server_2",
                name: "transceiver_2",
                description: "YOYO REZEDA & NADIME",
                address: "123456789",
                type: "endDevice",
                deviceId: "server_1",
                configuration: "{'test1':'server_1','test2':'test2'}"
            }
        };
        const payloads = [
            {
                topic: 'box_dbsync',
                messages: JSON.stringify(dataExample), key: 'box_dbsync.server_1'
            }
        ];




        KafkaService.instance.sendMessage(payloads, true, true)
            .pipe(tap((result: any) => {
                this.sendSuccess(res, result);
                WebSocketService.sendMessage('server_1', JSON.stringify(result));
            })).subscribe();

        // KafkaService.instance.sendMessage(payloads, true).pipe(mergeMap((checkResponse: any) =>

        //     of(false).pipe(
        //         map(val => {

        //             const responseArray = KafkaService.instance.arrayOfResponse;
        //             if (responseArray.length > 0) {

        //                 for (let index = 0; index < responseArray.length; index++) {
        //                     const element = responseArray[index];
        //                     const result = JSON.parse(element.value);
        //                     if (result.offset === checkResponse.oin) {
        //                         responseArray.splice(index, 1);

        //                         return { status: 'OK', message: "process success!" };
        //                     }
        //                 }
        //             }
        //             throw { status: 'KO', message: "process timeOut!" };
        //         }),
        //         retryWhen(genericRetryStrategy({
        //             durationBeforeRetry: 200,
        //             maxRetryAttempts: 40
        //         })), catchError((error: any) => {
        //             console.log(JSON.stringify(error));

        //             return error;
        //         }))
        // )).subscribe((x: any) => {
        //     if (x) {
        //         WebSocketService.sendMessage('server_1', JSON.stringify(x));
        //         this.sendSuccess(res, x);
        //     }
        // },
        //     (e) => {
        //         this.sendSuccess(res, JSON.stringify(e));
        //     });

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
