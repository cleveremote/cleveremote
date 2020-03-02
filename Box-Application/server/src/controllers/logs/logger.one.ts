// tslint:disable-next-line: no-default-import
import Controller from '../_controller';
import { Request, Response } from 'express';
import { isAuthenticated } from '../../middleware/authentication';
// import { XbeeService } from '../../config/xbee';
import { MongoService } from '../../services/mongo.service';
import { map, mergeMap } from 'rxjs/operators';
import { ILog } from '../../entities/mongo.entities/logs';
import { XbeeService } from '../../services/xbee.service';
import { TransceiverService } from '../../services/device/transceiver.service';
import { of } from 'rxjs';
import { XbeeHelper } from '../../services/xbee/xbee.helper';

// tslint:disable-next-line: no-default-export
export default class Logger extends Controller {

    public _params = ':device_id';

    // @isAuthenticated()
    public get(req: Request, res: Response): void {
        const trans = new TransceiverService();
        // trans.GetNodeDiscovery().pipe(
        //     mergeMap((result: any) => {
        //         const t = result;
        //         return of(true);
        //     })
        // )
        //     .subscribe((nodeIdentification: any) => {
        //         console.log("Found node:\n", nodeIdentification);
        //     }, (e: any) => {
        //         console.log("Command failed:\n", e);
        //     }, () => {
        //         console.log("Timeout reached; done finding nodes");
        //     });
//         const str = XbeeHelper.toHexString([0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82, 0x49, 0xC0, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00, 0x34, 0x02, 0x00, 0xFE, 0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF3, 0x71, 0xB9, 0x40, 0x00, 0xA2, 0x13, 0x00, 0xFD, 0xCF, 0x12, 0x00, 0x01, 0xFF]);
// const t = 2;
        // trans.coordinatorInitScan().subscribe((result) => {

        //     // "{"resultRtg":[{"id":1,"status":0,"routingtableentries":40,"startindex":0,"routingtablelistcount":15,"routingtablelist":[{"destNwkAddr":39483,"routeStatus":"ACTIVE","nextHopNwkAddr":39483},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0}]},{"id":1,"status":0,"routingtableentries":40,"startindex":15,"routingtablelistcount":15,"routingtablelist":[{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0}]},{"id":1,"status":0,"routingtableentries":40,"startindex":30,"routingtablelistcount":10,"routingtablelist":[{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0},{"destNwkAddr":0,"routeStatus":"INACTIVE","nextHopNwkAddr":0}]}],"resultLqi":[{"id":1,"status":0,"neighbortableentries":2,"startindex":0,"neighborlqilistcount":2,"neighborlqilist":[{"extPandId":"0x0000000000001234","extAddr":"0x0013a20040c0497d","nwkAddr":39483,"deviceType":1,"rxOnWhenIdle":1,"relationship":3,"permitJoin":2,"depth":15,"lqi":252},{"extPandId":"0x0000000000001234","extAddr":"0x0013a20040b971f3","nwkAddr":52101,"deviceType":2,"rxOnWhenIdle":0,"relationship":1,"permitJoin":0,"depth":1,"lqi":255}]}]}"

        //     const t = result;
        // });

        // trans.testBroadcast().subscribe( (frame) =>{
        //     // response will be [ 0 ] from the response frame
        //     console.log("Got response from " + frame.remote16 + ": " + frame.commandData);
        //     this.sendSuccess(res, "frame.commandData");
        // },  (e:any) =>{
        //     console.log("Command transmission failed:\n", e);
        //     this.sendError(res,e);
        // });

        // // const userCtrl = new UserController<Model<IUserModel>>(UserModule);
        // // userCtrl.getAll(req, res);
        // const toto = { source: 'toto', module: "string", value: "string", date: new Date() };

        // MongoService.createLogs(toto as ILog).pipe(
        //     mergeMap(data => MongoService.getLogs().pipe(
        //         map(logs => logs)
        //     ))
        // ).subscribe((result: Array<ILog>) => {
        //     this.sendSuccess(res, result);
        // });
    }
}
