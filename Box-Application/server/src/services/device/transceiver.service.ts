import { DeviceService } from "./device.service";
import { AT_COMMAND_RESPONSE } from 'xbee-api'
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map } from "rxjs/operators";
import { empty, timer, Observable } from "rxjs";
import xbee_api = require("xbee-api");

export class TransceiverService extends DeviceService {

    public configuretransceiver(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...
        return {};
    }

    public GetNodeDiscovery(): Observable<any> {

        // we want to ignore the command stream result as well as any error (for no
        // reply resulting from no found nodes)
        const nodeDiscoveryCommandStream = this.xbee.localCommand({ command: "ND" }).pipe(
            catchError(() => {
                const t = 2;

                return empty();
            }),
            ignoreElements()
        );

        const nodeDiscoveryRepliesStream = this.xbee.allPackets.pipe(
            filter((packet: any) => packet.type === xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE && packet.command === "ND"),
            pluck("nodeIdentification")
        );

        return this.xbee
            .localCommand({
                command: "NT"
            })
            .pipe(
                flatMap((ntResult: any) => {
                    const timeoutMs = ntResult.readInt16BE(0) * 100;
                    console.log("Got node discovery timeout:", timeoutMs, "ms");

                    return nodeDiscoveryRepliesStream.pipe(
                        takeUntil(timer(timeoutMs + 1000)),
                        merge(nodeDiscoveryCommandStream)
                    );
                })
            );
    }
}
