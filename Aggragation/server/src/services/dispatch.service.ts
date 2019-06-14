import { Message, ConsumerGroup } from "kafka-node";
import { Observable } from "rxjs";
import { getCustomRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";

export class DispatchService {
    constructor(private readonly topics: Array<any>) {
    }

    public routeMessage(consumer: ConsumerGroup, message: Message): void {
        // console.log(
        //     '%s read msg %s Topic="%s" Partition=%s Offset=%d',
        //     consumer.memberId,
        //     message.value,
        //     message.topic,
        //     message.partition,
        //     message.offset
        // );
    }

    public checkFirstConnection(): Observable<boolean> {
        const accountRepository = getCustomRepository(AccountExt);

        return accountRepository.getAccount();
    }

}
