import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { Observable, of, observable } from 'rxjs';
import { of as observableOf, from as observableFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { token } from 'morgan';

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

class WebSocketConfig {

    public static wss: WebSocket.Server;
    constructor(serverInstance: http.Server) {
        WebSocketConfig.wss = new WebSocket.Server({ server: serverInstance, verifyClient : function (info, cb) {
            const token = <string>info.req.headers['sec-websocket-protocol'];
            if (!token)
                cb(false, 401, 'Unauthorized')
            else {
                jwt.verify(token, '123456789', function (err, decoded) {
                    if (err) {
                        cb(false, 401, 'Unauthorized')
                    } else {
                        (<any>info.req).user = decoded
                        cb(true)
                    }
                })
    
            }
        }  });

       
    }

    public init(): Observable<WebSocket.Server> {
        return this.initDependencies().pipe(
            map(() => WebSocketConfig.wss));
    }
    public  createMessage(content: string, isBroadcast = false, sender: any = undefined): string {
        return JSON.stringify(new Message(content, isBroadcast, sender));
    }
    public  initDependencies(): Observable<void> {
        console.log('* start init websocket...');
        return observableOf(true).pipe(
            map(() => {
                const wss = WebSocketConfig.wss;
                WebSocketConfig.wss.on('connection', (ws: WebSocket) => {
                    const extWs = ws as ExtWebSocket;
                    extWs.isAlive = true;
                    ws.on('pong', () => { extWs.isAlive = true; });
                    ws.onmessage = (event: IWebSocketEvent) => { 
                        this.onMessage(event);
                     };
                    ws.onclose = (event:any)=>{

                        const t = 2;
                    };
                    ws.onerror = (e: IWebSocketError) => { console.warn(`Client disconnected - reason: ${e.error}`) };
                    ws.send(this.createMessage('Hi there, I am a WebSocket server'));
                    console.log('* init websocket OK.')
                });
                this.stayConnected();
            }));
    }
    public  stayConnected() {
        setInterval(() => {
            WebSocketConfig.wss.clients.forEach((ws: WebSocket) => {
                const extWs = ws as ExtWebSocket;
                var user = ws.url

                jwt.verify(ws.protocol, '123456789', function (err, decoded) {
                    if (err || !extWs.isAlive) {
                        return ws.close(1000,'token expires');
                    }
                    extWs.isAlive = false;
                    ws.ping(null, undefined);
                });
                
            });
        }, 10000);
    }

    public  onMessage(event: IWebSocketEvent): any {
        const message = JSON.parse(<string>event.data) as Message;
        setTimeout(() => {
            if (message.isBroadcast) {
                WebSocketConfig.wss.clients
                    .forEach(client => {
                        if (client != event.target) {
                            client.send(this.createMessage(message.content, true, message.sender));
                        }
                    });
            }
            //to debug temp
            event.target.send(this.createMessage(`You sent -> ${message.content}`, message.isBroadcast));
        }, 1000);
    }

}
export default WebSocketConfig;
