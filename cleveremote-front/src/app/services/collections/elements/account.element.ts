import { BaseElement } from './base.element';
import { UserElement } from './user.element';
import { DeviceElement } from './device.element';

export class AccountElement extends BaseElement {
    public name: string;
    public description: string;
    public users: Array<UserElement>;
    public devices: Array<DeviceElement>;
}