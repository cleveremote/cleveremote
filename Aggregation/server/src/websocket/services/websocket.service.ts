import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, retryWhen, catchError } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { Tools } from '../../common/tools-service';
import { KafkaService } from '../../kafka/services/kafka.service';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { v1 } from 'uuid';
import { IWSMessage, SYNC_ACTION, ELEMENT_TYPE } from './interfaces/ws.message.interfaces';
import { TYPE_MODULE } from '../../manager/interfaces/module.interfaces';

export interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

export class MessageWs {
    constructor(
        public content: string,
        public isBroadcast = false,
        public sender: { id: string }
    ) { }
}

export interface IWebSocketEvent {
    data: WebSocket.Data;
    type: string;
    target: WebSocket;
}

export interface IWebSocketError {
    error: any;
    message: string;
    type: string;
    target: WebSocket;
}

export enum EVENT_TYPE {
    CLOSE = 'ONCLOSE',
    CONNECTION = 'ONCONNECTION',
    ONERROR = 'ONERROR',
    PONG = 'PONG'
}

export class WebSocketService {

    public static wss: WebSocket.Server;

    public static sendMessage(clientId: string, content: string, exlude: Array<string> = []): void {
        if (WebSocketService.wss && WebSocketService.wss.clients) {
            const clientArray = [...WebSocketService.wss.clients];
            const clients = clientArray.filter((x: any) => exlude[0] !== x.protocol); // accountId ===  
            clients.forEach(client => {
                const message = JSON.stringify(new MessageWs(content, false, undefined));
                client.send(message);
            });
        }
    }

    public static syncClients(typeAction: SYNC_ACTION, target: ELEMENT_TYPE, entity: any, request: any): void {
        const messageToBuild = {
            typeAction: typeAction,
            target: target,
            date: new Date(),
            data: [entity]
        };

        const exclude = request && request.headers && request.headers.authorization && request.headers.authorization.split(" ")[1] ? [request.headers.authorization.split(" ")[1]] : [];

        const message = JSON.stringify(messageToBuild);
        WebSocketService.sendMessage('', message, exclude);
        // if (WebSocketService.wss && WebSocketService.wss.clients) {
        //     const clientArray = [...WebSocketService.wss.clients];
        //     const clients = clientArray.filter((x: any) => exclude[0] !== x.protocol); // accountId ===  
        //     clients.forEach(client => {
        //         const messageToSend = JSON.stringify(new MessageWs(message, false, undefined));
        //         client.send(messageToSend);
        //     });
        // }
    }

    constructor(serverInstance: http.Server) {
        WebSocketService.wss = new WebSocket.Server({
            server: serverInstance, verifyClient(info, cb): void {
                const token = info.req.headers['sec-websocket-protocol'] as string;
                if (!token) {
                    cb(false, 401, 'Unauthorized');
                } else {
                    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                        if (err) {
                            cb(false, 401, 'Unauthorized');
                        } else {
                            (info.req as any).user = decoded;
                            cb(true);
                        }
                    });
                }
            }
        });

    }

    public init(): Observable<WebSocket.Server> {
        return of(WebSocketService.wss)
            .pipe(tap(_ => this.stayConnected()));
    }

    public createMessage(content: string, isBroadcast = false, sender?: any): string {
        return JSON.stringify(new MessageWs(content, isBroadcast, sender));
    }

    public stayConnected(): void {
        setInterval(() => {
            WebSocketService.wss.clients.forEach((ws: WebSocket) => {
                const extWs = ws as ExtWebSocket;

                jwt.verify(ws.protocol, '123456789', (err, decoded) => {
                    if (err || !extWs.isAlive) {
                        ws.close(1000, 'token expires');
                        return;
                    }
                    extWs.isAlive = false;
                    ws.ping(undefined, undefined);
                });

            });
        }, 10000);
    }

}
