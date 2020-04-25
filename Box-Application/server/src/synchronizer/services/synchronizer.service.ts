import { Message, ConsumerGroupStream } from "kafka-node";
import { Observable, of, forkJoin } from "rxjs";
import { mergeMap, filter, tap, map, catchError } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../manager/services/mapper.service";
import { LoggerService } from "../../manager/services/logger.service";
import { Tools, liveRefresh } from "../../common/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { v1 } from 'uuid';

import * as _colors from 'colors';
import { XbeeService } from "../../xbee/services/xbee.service";
import { ACTION_TYPE } from "../../websocket/services/interfaces/ws.message.interfaces";

@Injectable()
export class SynchronizerService {
    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService) {

    }

}
