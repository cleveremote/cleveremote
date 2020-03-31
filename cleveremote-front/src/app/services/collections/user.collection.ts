import { IUpdatable } from './interfaces/collection.interfaces';
import { ModuleElement } from './elements/module.element';
import { Subject } from 'rxjs';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';
import { UserElement } from './elements/user.element';

@Injectable()
export class UserCollection extends BaseCollection<UserElement> {

    public parentsToSync = [
        'GroupView',
        'Transceiver'
    ];

    public elements: Array<UserElement> = [];


    public type = 'Module';

    public reload(userEntities: any) {
        userEntities.forEach(userEntity => {
            let userElement = this.elements.find((element) => element.id === userEntity.id);
            if (!userElement) {
                this.elements.push(userEntity);
            } else {
                userElement = userEntity;
            }
        });
        const ids = userEntities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);
    }
}
