import { IUpdatable } from './interfaces/collection.interfaces';
import { Subject } from 'rxjs';
import { GroupViewElement } from './elements/groupview.element';
import { TransceiverElement } from './elements/transceiver.element';
import { DeviceElement } from './elements/device.element';
import { SchemeElement } from './elements/scheme.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { SectorCollection } from './sector.collection';

@Injectable()
export class SchemeCollection extends BaseCollection<SchemeElement> {

    public parentsToSync = [
        // 'Device'
    ];

    public elements: Array<SchemeElement> = [];

    public type = 'Scheme';

    constructor(private sectorCollection: SectorCollection) {
        super();
    }

    public reload(schemeEntities: any) {

        schemeEntities.forEach(schemeEntity => {
            schemeEntity.svg = schemeEntity.svg.data;

            if (schemeEntity.sectors && schemeEntity.sectors.length > 0) {
               schemeEntity.sectors = this.sectorCollection.reload(schemeEntity.sectors);
            }

            const elementIndex = this.elements.findIndex((g) => g.id === schemeEntity.id);
            if (elementIndex === -1) {
                this.elements.push(schemeEntity);
            } else {
                this.elements[elementIndex] = schemeEntity;
            }
        });

        const ids = schemeEntities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);

    }
}
