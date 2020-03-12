import { of, Observable } from "rxjs";
import { mergeMap, delay, tap, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { XbeeService } from "../../xbee/services/xbee.service";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { ManagerService } from "../../manager/services/manager.service";
import { Tools } from "../../common/tools-service";

@Injectable()
export class LaunchService {

    constructor(
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => DispatchService)) private readonly dispatchService: DispatchService,
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        Tools.getSerialNumber()
            .pipe(delay(1000))
            .pipe(mergeMap((config: any) => this.kafkaService.initCommonKafka()))
            .pipe(mergeMap((serialNumber: any) => this.initFirstConnexion()))
            .pipe(delay(100))
            .pipe(mergeMap((resKafka: boolean) => resKafka ? this.xbeeService.init() : of(false)))
            .pipe(delay(100))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => Tools.stopProgress()))
            .toPromise();
    }

    public initFirstConnexion(): Observable<any> {
        return this.managerService.getPartitionconfig()
            .pipe(mergeMap((config: any) => {
                if (config) {
                    return this.kafkaService.initKafka(config);
                }
                return this.kafkaService.initKafka()
                    .pipe(mergeMap((result: any) => {
                        console.log('send message and start listen');
                        // const dataExample =  { serialNumber: '123456789'};
                        // const payloads = [
                        //     { topic: 'aggregator_init_connexion', messages: JSON.stringify(dataExample), key: 'init-connexion' }
                        // ];

                        // this.kafkaService.sendMessage(payloads, true).subscribe(
                        //     () => { },
                        //     (e) => {
                        //         Tools.logError('error on send message => ' + JSON.stringify(e));
                        //     });
                        return this.kafkaService.startListenerForSyncConnexion().pipe(mergeMap((message: any) =>
                            this.dispatchService.proccessSyncConnexion(String(message.value))));
                    }
                    ))
                    .pipe(mergeMap((res: boolean) => this.kafkaService.init(config)));
            }));
    }

}
