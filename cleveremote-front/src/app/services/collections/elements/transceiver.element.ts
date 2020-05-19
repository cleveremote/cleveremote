import { BaseElement } from './base.element';
import { ModuleElement } from './module.element';
import { TRANSCIEVER_TYPE, TRANSCIEVER_STATUS } from './interfaces/transceiver.interfaces';

export class TransceiverElement extends BaseElement {
    public name: string;
    public address: string;
    public description: string;
    public deviceId: string;
    public sectorId: Array<string>;
    public type: TRANSCIEVER_TYPE;
    public status: TRANSCIEVER_STATUS;
    public modules: Array<ModuleElement>;
    public configuration: any;
    public pending: TransceiverElement;

}