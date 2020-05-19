import { BaseElement } from './base.element';
import { TYPE_IO, TYPE_MODULE } from './interfaces/module.interfaces';
import { TYPE_IO_LABEL } from './interfaces/transceiver.interfaces';

export class ModuleElement extends BaseElement {
    public name: string;
    public type: TYPE_MODULE;
    public typeLabel: string;
    public configuration: any; // think about model
    public value: string;
    public transceiverId: string;
    public groupViewId: Array<string>;
    public deviceId: string;
    public lastLog: any;
    public portNum: string;
    public status: string;
    public description: string;
    public prefix: string;
    public suffix: string;
    public applyFunction: string;

    constructor(module: any) {
        super();
        this.id = module.id;
        this.name = module.name;
        this.type = this.getModuleType(module.port, (module.transceiver.configuration as any).IOCfg);
        this.typeLabel = TYPE_IO_LABEL[TYPE_IO[module.transceiver.configuration.IOCfg[module.port][0]]];
        this.configuration = { data: 'comming soon' };
        this.value = (module).type === TYPE_IO.DIGITAL_OUTPUT_HIGH ? 'ON' : 'OFF';
        this.deviceId = module.transceiver.deviceId;
        this.transceiverId = module.transceiver.id;
        this.portNum = module.port;
        this.status = module.status;
        this.prefix = module.prefix;
        this.suffix = module.suffix;
        this.applyFunction = module.applyFunction;
        this.description = module.description;
    }

    public getModuleType(port: string, transceiverCfg: any): TYPE_MODULE {
        return transceiverCfg[port][0] === TYPE_IO.DIGITAL_OUTPUT_HIGH || TYPE_IO.DIGITAL_OUTPUT_LOW ? TYPE_MODULE.RELAY : TYPE_MODULE.SENSOR;
    }

}