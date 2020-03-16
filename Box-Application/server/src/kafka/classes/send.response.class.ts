import { ConsumerGroupStream, Message } from "kafka-node";
import { Observable, ConnectableObservable } from "rxjs";
import { ISendResponse } from '../interfaces/send.response.interface';

export class SendResponse {
    public topic: string;
    public partition: number;
    public offset: number;

    constructor(public response: ISendResponse) {
        this.topic = Object.keys(response)[0];
        this.partition = Number(Object.keys(response[this.topic])[0]);
        this.offset = response[this.topic][this.partition];
    }


}