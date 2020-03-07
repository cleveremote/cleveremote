import { XbeeService } from "../../services/xbee.service";

export class DeviceService {
    public xbee = XbeeService.xbee;

    public configuretransceiver(configuration: any): any {
        // configuration module port Digital/out/in/spi/ad...

        return {};
    }



}
