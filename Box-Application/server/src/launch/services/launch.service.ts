import { of, Observable } from "rxjs";
import { mergeMap, delay, tap, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { XbeeService } from "../../xbee/services/xbee.service";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { ManagerService } from "../../manager/services/manager.service";
import { multibar } from "../../common/progress.bar";
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

        this.initFirstConnexion()
            .pipe(delay(1000))
            .pipe(mergeMap((config: any) => this.kafkaService.init(config)))
            .pipe(delay(100))
            .pipe(mergeMap((resKafka: boolean) => resKafka ? this.xbeeService.init() : of(false)))
            .pipe(delay(100))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => Tools.stopProgress()))
            .toPromise();
    }

    public initFirstConnexion(): Observable<any> {
        return this.managerService.getPartitionconfig()
            .pipe(map((cfg: any) => {
                if (cfg) {
                    console.log('not first cnx');
                    return cfg;
                }
                console.log('traitement necessaire pour linitialization du boitier');
                return of(undefined);
            }));
    }

}
