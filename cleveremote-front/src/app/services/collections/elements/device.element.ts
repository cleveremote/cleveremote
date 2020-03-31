import { BaseElement } from './base.element';
import { GroupViewElement } from './groupview.element';
import { SchemeElement } from './scheme.element';
import { TransceiverElement } from './transceiver.element';

export class DeviceElement extends BaseElement {
    public name: string;
    public description: string;
    public accountId: Array<string>;
    public groupViews: Array<GroupViewElement>;
    public schemes: Array<SchemeElement>;
    public transceivers: Array<TransceiverElement>;
}