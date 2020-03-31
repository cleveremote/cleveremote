import { BaseElement } from './base.element';
import { ModuleElement } from './module.element';

export class GroupViewElement extends BaseElement {
    public name: string;
    public description: string;
    public deviceId: string;
    public sectorId: string;
    public modules: Array<ModuleElement>;
}