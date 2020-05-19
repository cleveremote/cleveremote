import { of, Observable } from "rxjs";
import { mergeMap, delay, tap, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { XbeeService } from "../../xbee/services/xbee.service";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { ManagerService } from "../../manager/services/manager.service";
import { Tools } from "../../common/tools-service";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { SynchronizerService } from "../../synchronizer/services/synchronizer.service";

@Injectable()
export class LaunchService {

    constructor(
        @Inject(forwardRef(() => SynchronizerService)) private readonly synchronizerService: SynchronizerService,
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => DispatchService)) private readonly dispatchService: DispatchService,
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        of(true)
            .pipe(delay(1000))
            .pipe(tap(() => Tools.loginfo('* Start required initialization process boot ...')))
            .pipe(tap(() => Tools.debug = true))
            .pipe(mergeMap(() => Tools.getSerialNumber()))
            .pipe(mergeMap(() => this.kafkaService.initCommonKafka()))
            .pipe(mergeMap(() => this.initFirstConnexion()))
            .pipe(mergeMap(() => this.synchronizerService.init()))
            .pipe(mergeMap((resKafka: boolean) => resKafka ? this.xbeeService.init() : of(false)))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => { Tools.debug = false; Tools.logSuccess('* Box ready for work!'); }))
            .toPromise();
    }

    public initFirstConnexion(): Observable<any> {
        return this.managerService.getPartitionconfig()// this.managerService.getPartitionconfig()// of(false) for first cnx load
            .pipe(mergeMap((config: any) => {
                if (config) {
                    return this.kafkaService.initKafka(config);
                }
                return this.kafkaService.initKafka()
                    .pipe(mergeMap(res => this.kafkaService.clearPreviousMessages(`${Tools.serialNumber}_init_connexion`)))
                    .pipe(mergeMap(() => this.dispatchService.initFirstConnexion()))
                    .pipe(mergeMap((partitionConfig: IPartitionConfig) => this.kafkaService.initKafka(partitionConfig)));
            }));
    }

}
