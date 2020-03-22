import { ConsumerGroupStream, Message } from "kafka-node";
import { Observable, ConnectableObservable } from "rxjs";

export class ConsumerCustom {
    public consumer: ConsumerGroupStream;
    public eventData: ConnectableObservable<Message>;
}