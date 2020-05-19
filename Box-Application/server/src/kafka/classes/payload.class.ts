import { ConsumerGroupStream, Message } from "kafka-node";
import { Observable, ConnectableObservable } from "rxjs";

export class Payload {
    constructor(public topic: string, public messages: string, public key?) {

    }
}