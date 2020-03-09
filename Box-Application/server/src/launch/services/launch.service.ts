import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../../entities/interfaces/entities.interface";
import { Account } from "../../entities/gen.entities/account";
import { mergeMap, delay, tap } from "rxjs/operators";
import { Device } from "../../kafka/entities/device";
import { PartitionConfig } from "../../kafka/entities/partition_config";
import { User } from "../../entities/gen.entities/users";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../services/mapper.service";
import { LoggerService } from "../../services/logger.service";
import { Tools } from "../../services/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { getRepository } from "typeorm";
import { TransceiverService } from "../../xbee/services/transceiver.service";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { multibar } from "../../common/progress.bar";

@Injectable()
export class LaunchService {

    constructor(
        @Inject(forwardRef(() => TransceiverService)) private readonly xbeeService: TransceiverService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => DispatchService)) private readonly dispatchService: DispatchService) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        of(true)
            .pipe(delay(100))
            .pipe(mergeMap(() => this.kafkaService.init()))
            .pipe(delay(100))
            .pipe(mergeMap((resKafka: boolean) => resKafka ? this.xbeeService.init() : of(false)))
            .pipe(delay(100))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => multibar.stop()))
            .toPromise();
    }

}
