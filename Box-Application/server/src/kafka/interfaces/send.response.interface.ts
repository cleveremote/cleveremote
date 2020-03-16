import { ConsumerGroupStream, Message } from "kafka-node";
import { Observable, ConnectableObservable } from "rxjs";

export interface ISendResponse {
    [toptic: string]: any;
}
