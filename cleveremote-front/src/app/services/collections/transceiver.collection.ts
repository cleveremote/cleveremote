import { Subject } from 'rxjs';
import { TransceiverElement } from './elements/transceiver.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { ModuleCollection } from './module.collection';

@Injectable()
export class TransceiverCollection extends BaseCollection<TransceiverElement> {

    public parentsToSync = [];

    public elements: Array<TransceiverElement> = [];
    public type = 'Transceiver';

    constructor(private moduleCollection: ModuleCollection) {
        super();
    }

    public reload(transceiverEntities: any) {
        transceiverEntities.forEach(transceiverEntity => {
            if (transceiverEntity.modules && transceiverEntity.modules.length > 0) {
                transceiverEntity.modules = this.moduleCollection.reload(transceiverEntity.modules);
            }
            const elementIndex = this.elements.findIndex((g) => g.id === transceiverEntity.id);
            if (elementIndex === -1) {
                this.elements.push(transceiverEntity);
            } else {
                this.elements[elementIndex] = transceiverEntity;
            }
        });
        const ids = transceiverEntities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);
    }

}
