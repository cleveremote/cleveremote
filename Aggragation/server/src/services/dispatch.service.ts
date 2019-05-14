import { Message } from "kafka-node";
import { Observable } from "rxjs";
import { getCustomRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";

export class DispatchService {
    constructor(private readonly topics: Array<string>) {
    }

    public routeMessage(message: Message): void {
        const top = this.topics;
        // const receivedMessage = JSON.parse(result.value);
        console.log(`message received kafka: ${message.value}`);
        // let cell = await Cell.save(newCell as ICell);
        // save in db mongo ...
        // pubsub.publish('newCell', { newCell: cell });
        // notify with websocket if need
    }

    public checkFirstConnection(): Observable<boolean> {
        const accountRepository = getCustomRepository(AccountExt);

        return accountRepository.getAccount();
    }

}
