import { of } from "rxjs";
import { mergeMap, delay, tap } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { XbeeService } from "../../xbee/services/xbee.service";
import { DispatchService } from "../../dispatch/services/dispatch.service";
import { multibar } from "../../common/progress.bar";

@Injectable()
export class LaunchService {

    constructor(
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => DispatchService)) private readonly dispatchService: DispatchService) {
    }

    public async onApplicationBootstrap(): Promise<void> {
        of(true)
            .pipe(delay(1000))
            .pipe(mergeMap(() => this.kafkaService.init()))
            .pipe(delay(100))
            .pipe(mergeMap((resKafka: boolean) => resKafka ? this.xbeeService.init() : of(false)))
            .pipe(delay(100))
            .pipe(mergeMap((resXbee: boolean) => resXbee ? this.dispatchService.init() : of(false)))
            .pipe(tap(() => multibar.stop()))
            .toPromise();
    }

}
