import { of, Observable } from "rxjs";
import { mergeMap, delay, tap, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { ManagerService } from "../../manager/services/manager.service";
import { Tools } from "../../common/tools-service";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";

@Injectable()
export class LaunchService {

    constructor(
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
            .pipe(mergeMap(() => this.managerService.getDevicesPartitionConfig()))
            .pipe(mergeMap((config: Array<IPartitionConfig>) => this.kafkaService.initKafka(config)))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => { Tools.debug = true; Tools.logSuccess('* Aggregation Server ready!'); }))
            .toPromise();
    }


}
