import { Request, Response, Application } from 'express';
import { map, mergeMap } from 'rxjs/operators';
import * as dotenv from "dotenv";
import * as http from "http";
import { Server } from './server';
import { WebSocketService } from './services/websocket.service';
import { XbeeService } from './services/xbee.service';

dotenv.config({ path: ".env" });

const server: Server = new Server();

server.init()
    .pipe(mergeMap((app: Application) => {
        const serverInstance: http.Server = app.listen(app.get("port"), "0.0.0.0", (req: Request, res: Response) => {
            console.log(`* server OK on port ${app.get("port")}`);
        });
        serverInstance.timeout = Number(process.env.TIMEOUT_GLOBAL);
        // const xbee = new XbeeService(serverInstance);
        // xbee.init().subscribe();
        const wss = new WebSocketService(serverInstance);

        return wss.init();
    }))
    .subscribe();
