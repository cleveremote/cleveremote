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
import { ValueCollection } from './value.collection';

@Injectable()
export class DeviceCollection extends BaseCollection<DeviceElement> {

    public parentsToSync = [];
    public elements: Array<DeviceElement> = [];
    public type = 'Device';
    public onConnectivityChanges = new Subject<any>();

    constructor(
        private groupViewCollection: GroupViewCollection,
        private schemeCollection: SchemeCollection,
        private transceiverCollection: TransceiverCollection
    ) {
        super();
    }

    public reload(entities: any, levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD) {
        if (levelType === LEVEL_TYPE.ROOT) {
            entities.forEach(deviceEntity => {
                if (deviceEntity.groupViews && deviceEntity.groupViews.length > 0) {
                    deviceEntity.groupViews = this.groupViewCollection.reload(deviceEntity.groupViews);
                }

                if (deviceEntity.schemes && deviceEntity.schemes.length > 0) {
                    deviceEntity.schemes = this.schemeCollection.reload(deviceEntity.schemes);
                }

                if (deviceEntity.transceivers && deviceEntity.transceivers.length > 0) {
                    deviceEntity.transceivers = this.transceiverCollection.reload(deviceEntity.transceivers);
                }

                const elementIndex = this.elements.findIndex((g) => g.id === deviceEntity.id);
                if (elementIndex === -1) {
                    this.elements.push(deviceEntity);
                } else {
                    this.elements[elementIndex] = deviceEntity;
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
        const device = this.elements.find((element) => element.id === entities[0][classNameId]);
        if (!device) return [];
        switch (levelType) {
            case LEVEL_TYPE.GROUPVIEW:
                this.execSync(device.groupViews, this.groupViewCollection, entities, action);
                break;
            case LEVEL_TYPE.SCHEME:
                this.execSync(device.schemes, this.schemeCollection, entities, action);
                break;
            case LEVEL_TYPE.TRANSCEIVER:
                this.execSync(device.transceivers, this.transceiverCollection, entities, action);
                break;
        }
        return device;
    }
}
