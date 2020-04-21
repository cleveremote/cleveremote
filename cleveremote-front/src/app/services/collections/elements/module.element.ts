import { BaseElement } from './base.element';
import { TYPE_IO, TYPE_MODULE } from './interfaces/module.interfaces';

export class ModuleElement extends BaseElement {
    public name: string;
    public type: TYPE_MODULE;
    public configuration: any; // think about model
    public value: string;
    public transceiverId: string;
    public groupViewId: Array<string>;
    public deviceId: string;
    public lastLog : any;

    constructor(module: any) {
        super();
        this.id = module.id;
        this.name = module.name;
        this.type = this.getModuleType(module.port, (module.transceiver.configuration as any).IOCfg);
        this.configuration = { data: 'comming soon' };
        this.value = (module).type === TYPE_IO.DIGITAL_OUTPUT_HIGH ? 'ON' : 'OFF';
        this.deviceId = module.transceiver.deviceId;
    }

    public getModuleType(port: string, transceiverCfg: any): TYPE_MODULE {
        return transceiverCfg[port][0] === TYPE_IO.DIGITAL_OUTPUT_HIGH || TYPE_IO.DIGITAL_OUTPUT_LOW ? TYPE_MODULE.RELAY : TYPE_MODULE.SENSOR;
    }
}