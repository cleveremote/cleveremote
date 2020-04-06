import { BaseElement } from './base.element';
import { SectorElement } from './sector.element';

export class SchemeElement extends BaseElement {
    public name: string;
    public description: string;
    public parentScheme: string;
    public deviceId: string;
    public svg: string;
    public sectors: Array<SectorElement>;
}