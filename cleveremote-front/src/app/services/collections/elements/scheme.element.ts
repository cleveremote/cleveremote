import { BaseElement } from './base.element';

export class SchemeElement extends BaseElement {
    public name: string;
    public description: string;
    public parentScheme: string;
    public deviceId: string;
    public svg: string;
}