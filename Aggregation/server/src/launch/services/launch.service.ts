import { of, Observable } from "rxjs";
import { mergeMap, delay, tap, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { ManagerService } from "../../manager/services/manager.service";
import { Tools } from "../../common/tools-service";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { SynchronizerService } from "../../synchronizer/services/synchronizer.service";

@Injectable()
export class LaunchService {

    constructor(
        @Inject(forwardRef(() => SynchronizerService)) private readonly synchronizerService: SynchronizerService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => DispatchService)) private readonly dispatchService: DispatchService,
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService
    ) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        of(true)
            .pipe(delay(1000))
            .pipe(tap(() => Tools.loginfo('* Start required initialization process boot ...')))
            .pipe(tap(() => Tools.debug = false))
            .pipe(mergeMap(() => this.synchronizerService.init()))
            .pipe(mergeMap(() => this.managerService.getDevicesPartitionConfig()))
            .pipe(mergeMap((config: Array<IPartitionConfig>) => this.kafkaService.initKafka(config)))
            .pipe(mergeMap(devicesConfig => devicesConfig ? this.dispatchService.init(devicesConfig) : of(false)))
            .pipe(tap(() => { Tools.debug = true; Tools.logSuccess('* Aggregation Server ready!'); }))
            .toPromise();
    }


}
