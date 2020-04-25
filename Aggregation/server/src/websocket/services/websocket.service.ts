import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap, retryWhen, catchError } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { Tools } from '../../common/tools-service';
import { KafkaService } from '../../kafka/services/kafka.service';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { v1 } from 'uuid';
import { IWSMessage, ACTION_TYPE, ELEMENT_TYPE } from './interfaces/ws.message.interfaces';
import { TYPE_MODULE } from '../../manager/interfaces/module.interfaces';

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

export class Message {
    constructor(
        public content: string,
        public isBroadcast = false,
        public sender: { id: string }
    ) { }
}

interface IWebSocketEvent {
    data: WebSocket.Data;
    type: string;
    target: WebSocket;
}

interface IWebSocketError {
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
            const clients = clientArray.filter((x: any) => exlude[0] !== x.protocol);
            clients.forEach(client => {
                const message = JSON.stringify(new Message(content, false, undefined));
                client.send(message);
            });
        }
    }



    public static syncClients(typeAction: ACTION_TYPE, target: ELEMENT_TYPE, entity: any, request: any): void {
        const messageToBuild = {
            typeAction: typeAction,
            target: target,
            date: new Date(),
            data: [entity]
        };

        const exclude = request && request.headers && request.headers.authorization && request.headers.authorization.split(" ")[1] ? [request.headers.authorization.split(" ")[1]] : [];

        const message = JSON.stringify(messageToBuild);
        WebSocketService.sendMessage('', message, exclude);
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
        return this.initDependencies().pipe(
            map(() => WebSocketService.wss));
    }
    public createMessage(content: string, isBroadcast = false, sender?: any): string {
        return JSON.stringify(new Message(content, isBroadcast, sender));
    }
    public initDependencies(): Observable<void> {
        Tools.loginfo('* start init websocket...');

        return observableOf(true).pipe(
            map(() => {
                Tools.logSuccess('  => OK.');
                this.startCheckConnectivity();
                const wss = WebSocketService.wss;
                WebSocketService.wss.on('connection', (ws: WebSocket) => {
                    const extWs = ws as ExtWebSocket;
                    // ws.send(this.createMessage(JSON.stringify(connection)));
                    extWs.isAlive = true;
                    jwt.verify(extWs.protocol, '123456789', (err, decoded) => {
                        if (err) {
                            console.log('error connection websocket');
                        } else {
                            (extWs as any).userInfo = decoded;
                            const connection = { data: { message: 'Connected to the WebSocket server' }, typeAction: 'CONNECTION' };
                            const message = JSON.stringify(new Message(JSON.stringify(connection), false, undefined));
                            ws.send(message);
                        }
                    });
                    ws.on('pong', () => { extWs.isAlive = true; });
                    ws.onmessage = (event: IWebSocketEvent) => {
                        this.onMessage(event);
                    };
                    ws.onclose = (event: any) => { Tools.loginfo('Client quite') };
                    ws.onerror = (e: IWebSocketError) => { Tools.logWarn(`Client disconnected - reason: ${e.error}`); };
                });
                this.stayConnected();
            }));
    }

    public notifyBoxes(accountClients: Array<any>, liveRefresh: boolean, notify = true): void {
        const devices: Array<any> = accountClients[0].userInfo && accountClients[0].userInfo.data.devices;
        if (devices) {
            devices.forEach(device => {
                const payloads = [
                    {
                        topic: `box_action`,
                        messages: JSON.stringify({ messageId: v1(), action: ACTION_TYPE.CONNECTIVITY, liveRefresh: liveRefresh }),
                        key: `box_action.${device.id}`
                    }
                ];
                KafkaService.instance.sendMessage(payloads, true, 'aggregator_ack', 3500)
                    .pipe(catchError(e => {
                        const boxId = e.error[0].key.split('.')[1];
                        return of({ key: boxId, fail: true });
                    }))
                    .pipe(tap((response: any) => { //message kafka
                        const boxId = response.key || (response[0] && response[0].key);
                        if (boxId && notify) {
                            const boxConnectivityStatus = accountClients[0].userInfo.data.devices.find(_ => _.id === boxId).status;
                            const data = response.fail ? { data: [{ id: boxId, status: false }], typeAction: 'CONNECTIVITY' } : { data: [{ id: boxId, status: true }], typeAction: 'CONNECTIVITY' };
                            // if (((!boxConnectivityStatus && !response.fail) || (boxConnectivityStatus && response.fail)) && liveRefresh) {
                            accountClients.forEach(client => {
                                client.userInfo.data.devices.find(_ => _.id === boxId).status = response.fail ? false : true;
                                const message = JSON.stringify(new Message(JSON.stringify(data), false, undefined));
                                client.send(message);
                            });
                            //  }
                        }
                    }))
                    .subscribe();
            });
        }
    }


    public checkConnectivityByGroup(): void {
        const allClients = [...WebSocketService.wss.clients];
        const groupes = [...this.groupBy(allClients, client => client.userInfo ? client.userInfo.data.accountId : undefined)];
        groupes.forEach(groupe => {
            const key = groupe[0];
            const groupeClients = groupe[1];
            const clientsToNotify = groupeClients.filter((clt: any) => clt.userInfo && clt.userInfo.data.visible && clt.userInfo.data.devices.length > 0);
            if (clientsToNotify.length > 0) {
                this.notifyBoxes(clientsToNotify, true);
            }
            //else {
            //     const clientsToNotifyBis = groupeClients.filter((clt: any) => clt.userInfo && clt.userInfo.data.devices.length > 0);
            //     if (clientsToNotifyBis.length > 0) {
            //         this.notifyBoxes(clientsToNotifyBis, false, false);
            //     }
            // }
        });
    }

    public setLiveRefresh(event: any): void {
        const userInfo = event.target && event.target.userInfo;
        const allClients = [...WebSocketService.wss.clients];
        const groupes = [...this.groupBy(allClients, client => client.userInfo ? client.userInfo.data.accountId : undefined)];
        const filterGrp = groupes.find((_) => _[0] === userInfo.data.accountId);
        if (filterGrp) {
            const groupeClients = filterGrp[1];
            const clientsToNotify = groupeClients.filter((clt: any) => clt.userInfo && clt.userInfo.data.visible && clt.userInfo.data.devices.length > 0);
            if (clientsToNotify.length === 0) {
                this.notifyBoxes([event.target], false, false);
            }
        }
    }

    public groupBy(list, keyGetter): any {
        const map = new Map();
        list.forEach((item: any) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }

    public startCheckConnectivity(): void {
        setInterval(() => {
            this.checkConnectivityByGroup();
        }, 3000);
    }


    //  public startCheckConnectivity(input: boolean, accountId: string, isBroadcast: boolean, event: any): void {

    //     if (WebSocketService.wss && WebSocketService.wss.clients) {
    //         if (WebSocketService.wss.clients.size > 0) {
    //             let clients = [...WebSocketService.wss.clients];
    //             clients = clients.filter((client) => (client as any).userInfo && (client as any).userInfo.data && (client as any).userInfo.data.accountId === accountId && (client as any).userInfo.data.visible);
    //             if (clients.length > 0 && (clients[0] as any) && (clients[0] as any).userInfo && (clients[0] as any).userInfo.data && (clients[0] as any).userInfo.data.devices) {
    //                 (clients[0] as any).userInfo.data.devices.forEach(device => {
    //                     this.notifyBoxes(device, true);
    //                 });
    //             } else if (event) {
    //                 const userInfo = (event.target && event.target.userInfo) || (event.userInfo);
    //                 if (userInfo) {
    //                     userInfo.data.devices.forEach(device => {
    //                         this.notifyBoxes(device, false);
    //                     });
    //                 }
    //             }
    //         } else if (!input) {
    //             if (WebSocketService.wss.clients.size > 0) {
    //                 let clients = [...WebSocketService.wss.clients];
    //                 clients = clients.filter((client) => (client as any).userInfo && (client as any).userInfo.data && (client as any).userInfo.data.accountId === accountId && (client as any).userInfo.data.visible);
    //                 if (clients.length === 1 && (clients[0] as any) && (clients[0] as any).userInfo && (clients[0] as any).userInfo.data && (clients[0] as any).userInfo.data.devices && ((clients[0] as any).userInfo.data.visible === undefined || (clients[0] as any).userInfo.data.visible)) {
    //                     (clients[0] as any).userInfo.data.devices.forEach(device => {
    //                         this.notifyBoxes(device, true);
    //                     });
    //                 }
    //             } else if (event) {
    //                 (event as any).target.userInfo.data.devices.forEach(device => {
    //                     this.notifyBoxes(device, false);
    //                 });
    //             }
    //         }
    //     }
    // }



    // public notifyBoxes(device: any, liveRefresh: boolean, clients: Array<any>): void {
    //     const payloads = [
    //         {
    //             topic: `box_action`,
    //             messages: JSON.stringify({ messageId: v1(), action: ACTION_TYPE.CONNECTIVITY, liveRefresh: liveRefresh }),
    //             key: `box_action.${device}`
    //         }
    //     ];
    //     KafkaService.instance.sendMessage(payloads, true, 'aggregator_ack', 3000)
    //         .pipe(catchError(e => {
    //             const boxId = e.error[0].key.split('.')[1];
    //             return of({ key: boxId, fail: true });
    //         }))
    //         .pipe(tap((response: any) => { //message kafka
    //             const boxId = response.key;
    //             const boxConnectivityStatus = clients[0].userInfo.data.devices.find(_ => _.id === boxId).status;
    //             const data = response.fail ? { data: [{ id: boxId, status: false }], typeAction: 'CONNECTIVITY' } : { data: [{ id: boxId, status: true }], typeAction: 'CONNECTIVITY' };
    //             if ((!boxConnectivityStatus && !response.fail) || (boxConnectivityStatus && response.fail)) {
    //                 clients.forEach(client => {
    //                     const data = { data: [{ id: boxId, status: true }], typeAction: 'CONNECTIVITY' };
    //                     const message = JSON.stringify(new Message(JSON.stringify(data), false, undefined));
    //                     client.send(message);
    //                 });
    //             }
    //         }))
    //         .subscribe();
    // }


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

    public onMessage(event: IWebSocketEvent): any {
        const message = JSON.parse(event.data as string);
        if (message.type === 'VISIBILITY') {
            (event.target as any).userInfo.data.visible = message.visible;
            this.setLiveRefresh(event);
        }
    }

    // setTimeout(() => {
    //     if (message.isBroadcast) {
    //         WebSocketService.wss.clients
    //             .forEach(client => {
    //                 if (client !== event.target) {
    //                     client.send(this.createMessage(message.content, true, message.sender));
    //                 }
    //             });
    //     }
    //     //event.target.send(this.createMessage(`You sent -> ${message.content}`, message.isBroadcast));
    //     this.test(event);
    // }, 1000);

    // public testAddModule(): IWSMessage {
    //     return {
    //         typeAction: ACTION_TYPE.ADD,
    //         target: ELEMENT_TYPE.MODULE,
    //         date: new Date(),
    //         data: [{ id: v1(), name: 'module_' + v1(), type: TYPE_MODULE.RELAY, value: 'ON', transceiverId: 'server_1', groupViewId: ['server_1'] }] // aouter transceiverId + groupView
    //     };
    //     // return {
    //     //     typeAction: ACTION_TYPE.DELETE,
    //     //     target: ELEMENT_TYPE.MODULE,
    //     //     date: new Date(),
    //     //     data: [{ id: 'server_1'}]
    //     // };
    // }
    // public test(event: any): void {
    //     const message = JSON.parse(event.data) as Message;
    //     let dataExample = {
    //         messageId: v1(),
    //         entity: 'Account', type: 'UPDATE',
    //         data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
    //     };
    //     if (message.content === 'filter1') {
    //         dataExample = {
    //             messageId: v1(),
    //             entity: 'Account1', type: 'UPDATE',
    //             data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
    //         };
    //     }
    //     const success = { source: 'OK', module: "string", value: "string", date: new Date() };
    //     const fail = { source: 'FAIL', module: "string", value: "string", date: new Date() };
    //     // const dataExample = {
    //     //     entity: 'Account', type: 'UPDATE',
    //     //     data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
    //     // };
    //     const payloads = [
    //         {
    //             topic: 'box_action',
    //             messages: JSON.stringify(dataExample), key: 'box_action.server_1'
    //         }
    //     ];
    //     KafkaService.instance.sendMessage(payloads, true).pipe(mergeMap((checkResponse: any) =>

    //         of(false).pipe(
    //             map(val => {

    //                 const responseArray = KafkaService.instance.arrayOfResponse;
    //                 if (responseArray.length > 0) {

    //                     for (let index = 0; index < responseArray.length; index++) {
    //                         const element = responseArray[index];
    //                         const result = JSON.parse(element.value);
    //                         if (result.offset === checkResponse.oin) {
    //                             responseArray.splice(index, 1);

    //                             return { status: 'OK', message: "process success!" };
    //                         }
    //                     }
    //                 }
    //                 throw { status: 'KO', message: "process timeOut!" };
    //             }),
    //             retryWhen(genericRetryStrategy({
    //                 durationBeforeRetry: 200,
    //                 maxRetryAttempts: 40
    //             })), catchError((error: any) => {
    //                 console.log(JSON.stringify(error));

    //                 return error;
    //             }))
    //     )).subscribe((x: any) => {
    //         if (x) {
    //             //WebSocketService.sendMessage('server_1', JSON.stringify(x));
    //             // this.sendSuccess(res, x);
    //             event.target.send(this.createMessage(`response -> ${JSON.stringify(x)}`, false));
    //         }
    //     },
    //         (e: any) => {
    //             // this.sendSuccess(res, JSON.stringify(e));
    //             event.target.send(this.createMessage(`response -> ${JSON.stringify(e)}`, false));
    //         });
    // }


}
