import { Subject } from 'rxjs';
import { TransceiverElement } from './elements/transceiver.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { ModuleCollection } from './module.collection';
import { ValueElement } from './elements/value.element';
import { SectorCollection } from './sector.collection';
import { SELECT_STATUS, WORKING_STATUS } from './elements/interfaces/scheme.interfaces';
import { isLoweredSymbol } from '@angular/compiler';

@Injectable()
export class ValueCollection extends BaseCollection<ValueElement> {

    public parentsToSync = [];

    public elements: Array<ValueElement> = [];
    public type = 'Value';


    constructor(private moduleCollection: ModuleCollection,
        private sectorCollection: SectorCollection) {
        super();
    }

    public reload(valueEntities?: any) {
        if (valueEntities) {
            valueEntities.forEach(valueEntity => {
                const module = this.moduleCollection.elements.find((element) => element.id === valueEntity.valueId);
                module.value = valueEntity.value;
                const sectors = this.sectorCollection.elements.forEach(sector => {
                    const exist = sector.groupView[0].modules.find((moduleGroupView) => moduleGroupView.value === 'ON');

                    if (exist && (sector.status === WORKING_STATUS.STOP)) {
                        sector.status = WORKING_STATUS.INPROCCESS;
                        this.sectorCollection.onSectorStatusChange.next(sector);
                    } else if (!exist && (sector.status === WORKING_STATUS.INPROCCESS)) {
                        sector.status = WORKING_STATUS.STOP;
                        this.sectorCollection.onSectorStatusChange.next(sector);
                    }
                });
            });
            return [];
        } else {
            this.sectorCollection.elements.forEach(sector => {
                const exist = sector.groupView[0].modules.find((moduleGroupView) => moduleGroupView.value === 'ON');
                if (exist && (sector.status === WORKING_STATUS.STOP)) {
                    sector.status = WORKING_STATUS.INPROCCESS;
                    this.sectorCollection.onSectorStatusChange.next(sector);
                } else if (!exist && sector.status === WORKING_STATUS.INPROCCESS) {
                    sector.status = WORKING_STATUS.STOP;
                    this.sectorCollection.onSectorStatusChange.next(sector);
                }
            });
            return [];
        }

    }

}
