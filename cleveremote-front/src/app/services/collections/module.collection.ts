import { ModuleElement } from './elements/module.element';
import { BaseCollection } from './base.collection';
import { Injectable } from '@angular/core';

@Injectable()
export class ModuleCollection extends BaseCollection<ModuleElement> {

    public parentsToSync = [
        'GroupView',
        'Transceiver'
    ];

    public elements: Array<ModuleElement> = [];
    public type = 'Module';

    // // constructor(private valueCollection: ValueCollection) {
    // //     super();
    // // }

    public exludeModules(deviceId: string, groupViewModules: Array<ModuleElement>) {
        return this.elements.filter(x => x.deviceId === deviceId && !groupViewModules.includes(x));
    }

    public reload(moduleEntities: any) {
        moduleEntities.forEach(moduleEntity => {
            let moduleElement = this.elements.find((element) => element.id === moduleEntity.id);
            if (!moduleElement) {
                moduleElement = new ModuleElement(moduleEntity);
                this.elements.push(moduleElement);
            } else {
                try {
                    moduleElement = new ModuleElement(moduleEntity); // TODO maybe set function map attributes.
                } catch (error) {

                }

            }
        });
        const ids = moduleEntities.map(entity => entity.id);
        return this.elements.filter((ele) => ids.indexOf(ele.id) !== -1);
    }

    public updateValues(lastLogs: Array<any>) {
        lastLogs.forEach((log) => {
            const module = this.elements.find((element) => element.id === log.moduleId);
            if (module) {
                module.lastLog = log;
                module.value = log.value;
            }
        });
    }
}
