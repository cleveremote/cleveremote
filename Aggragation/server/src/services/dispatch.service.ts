import { Message } from "kafka-node";

export class DispatchService {
    constructor(private topics: Array<string>) {
        const t = 2;
    }

    public routeMessage(message: Message): void {
        // const receivedMessage = JSON.parse(result.value);
        console.log(`message received kafka: ${message.value}`);
        // let cell = await Cell.save(newCell as ICell);
        // save in db mongo ...
        // pubsub.publish('newCell', { newCell: cell });
        // notify with websocket if need
    }

}
