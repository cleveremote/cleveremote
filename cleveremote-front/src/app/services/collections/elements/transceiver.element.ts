import { BaseElement } from './base.element';
import { ModuleElement } from './module.element';

export class TransceiverElement extends BaseElement {
    public name: string;
    public description: string;
    public deviceId: string;
    public sectorId: Array<string>;
    public modules: Array<ModuleElement>;
}