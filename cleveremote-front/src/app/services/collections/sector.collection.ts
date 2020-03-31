import { IUpdatable } from './interfaces/collection.interfaces';
import { Subject } from 'rxjs';
import { GroupViewElement } from './elements/groupview.element';
import { TransceiverElement } from './elements/transceiver.element';
import { DeviceElement } from './elements/device.element';
import { SchemeElement } from './elements/scheme.element';
import { SectorElement } from './elements/sector.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { GroupViewCollection } from './groupview.collection';
import { LEVEL_TYPE, ACTION_TYPE } from '../websocket/interfaces/ws.message.interfaces';
import { SELECT_STATUS, WORKING_STATUS } from './elements/interfaces/scheme.interfaces';

@Injectable()
export class SectorCollection extends BaseCollection<SectorElement> {
    public elements: Array<SectorElement> = [];
    public type = 'Sector';
    public onSectorStatusChange = new Subject<SectorElement>();

    constructor(private groupViewCollection: GroupViewCollection) {
        super();
    }

    public reload(entities: any, levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD) {
        if (levelType === LEVEL_TYPE.ROOT) {
            entities.forEach(sectorEntity => {
                if (sectorEntity.groupView) {
                    sectorEntity.groupView = this.groupViewCollection.reload([sectorEntity.groupView]);
                }
                const sectorIndex = this.elements.findIndex((g) => g.id === sectorEntity.id);
                if (sectorIndex === -1) {
                    sectorEntity.status = WORKING_STATUS.STOP;
                    this.elements.push(sectorEntity);
                } else {
                    sectorEntity.status = this.elements[sectorIndex].status ? this.elements[sectorIndex].status : WORKING_STATUS.STOP;
                    this.elements[sectorIndex] = sectorEntity;
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
            case LEVEL_TYPE.GROUPVIEW:
                target.groupView = this.execSync(target.groupView, this.groupViewCollection, entities, action);
                break;
        }
        return target;
    }

}
