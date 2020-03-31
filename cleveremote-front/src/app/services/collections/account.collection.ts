import { IUpdatable } from './interfaces/collection.interfaces';
import { Subject } from 'rxjs';
import { GroupViewElement } from './elements/groupview.element';
import { TransceiverElement } from './elements/transceiver.element';
import { DeviceElement } from './elements/device.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { GroupViewCollection } from './groupview.collection';
import { SchemeCollection } from './scheme.collection';
import { SectorCollection } from './sector.collection';
import { TransceiverCollection } from './transceiver.collection';
import { ACTION_TYPE, LEVEL_TYPE } from '../websocket/interfaces/ws.message.interfaces';
import { DeviceCollection } from './device.collection';
import { AccountElement } from './elements/account.element';
import { UserCollection } from './user.collection';

@Injectable()
export class AccountCollection extends BaseCollection<AccountElement> {

    public parentsToSync = [];
    public elements: Array<AccountElement> = [];
    public type = 'Account';

    constructor(
        private deviceCollection: DeviceCollection,
        private userCollection: UserCollection
    ) {
        super();
    }

    public reload(entities: any, levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD) {
        if (levelType === LEVEL_TYPE.ROOT) {
            entities.forEach(accountEntity => {
                if (accountEntity.devices && accountEntity.devices.length > 0) {
                    accountEntity.devices = this.deviceCollection.reload(accountEntity.devices);
                }

                if (accountEntity.users && accountEntity.users.length > 0) {
                    accountEntity.users = this.userCollection.reload(accountEntity.users);
                }

                const elementIndex = this.elements.findIndex((g) => g.id === accountEntity.id);
                if (elementIndex === -1) {
                    this.elements.push(accountEntity);
                } else {
                    this.elements[elementIndex] = accountEntity;
                }
            });
            const ids = entities.map(entity => entity.id);
            return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);
        }
        this.loadBylevel(entities, levelType, action);

    }

    private loadBylevel(entities: any, levelType: LEVEL_TYPE, action: ACTION_TYPE) {
        let classNameId = this.constructor.name.replace('Collection', '') + 'Id';
        classNameId = classNameId.charAt(0).toLowerCase() + classNameId.slice(1);
        const target = this.elements.find((element) => element.id === entities[0][classNameId]);
        if (!target) return [];
        switch (levelType) {
            case LEVEL_TYPE.DEVICE:
                this.execSync(target.devices, this.deviceCollection, entities, action);
                break;
            case LEVEL_TYPE.USER:
                this.execSync(target.users, this.userCollection, entities, action);
                break;
        }
        return target;
    }
}
