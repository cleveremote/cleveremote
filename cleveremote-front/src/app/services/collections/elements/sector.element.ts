import { BaseElement } from './base.element';
import { GroupViewElement } from './groupview.element';
import { SELECT_STATUS, WORKING_STATUS } from './interfaces/scheme.interfaces';

export class SectorElement extends BaseElement {
    public name: string;
    public description: string;
    public schemeId: string;
    public groupViewId: string;
    public groupView: GroupViewElement;
    public status: WORKING_STATUS;
}