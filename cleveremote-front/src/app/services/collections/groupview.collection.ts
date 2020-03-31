import { IUpdatable } from './interfaces/collection.interfaces';
import { Subject } from 'rxjs';
import { GroupViewElement } from './elements/groupview.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { ModuleCollection } from './module.collection';

@Injectable()
export class GroupViewCollection extends BaseCollection<GroupViewElement> {

    public parentsToSync = [
        // 'Device',
        // 'Sector'
    ];

    public elements: Array<GroupViewElement> = [];
    public type = 'GroupView';

    constructor(private moduleCollection: ModuleCollection) {
        super();
    }

    public getGroupViewById(id: string) {
        return this.elements.find((groupView) => groupView.id === id);
    }

    public reload(groupEntities: Array<any>) {
        groupEntities.forEach(groupEntity => {
            if (groupEntity.modules && groupEntity.modules.length > 0) {
                groupEntity.modules = this.moduleCollection.reload(groupEntity.modules);
            }
            const elementIndex = this.elements.findIndex((g) => g.id === groupEntity.id);
            if (elementIndex === -1) {
                this.elements.push(groupEntity);
            } else {
                this.elements[elementIndex] = groupEntity;
            }
        });

        const ids = groupEntities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);

    }
}
