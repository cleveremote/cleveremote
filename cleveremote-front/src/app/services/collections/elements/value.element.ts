import { BaseElement } from './base.element';
import { GroupViewElement } from './groupview.element';
import { SELECT_STATUS } from './interfaces/scheme.interfaces';

export class ValueElement extends BaseElement {
    public value: string;
    public valueId: string;
}