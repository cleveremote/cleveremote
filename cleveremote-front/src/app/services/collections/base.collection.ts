import { IUpdatable } from './interfaces/collection.interfaces';
import { ModuleElement } from './elements/module.element';
import { Subject } from 'rxjs';
import { ACTION_TYPE, LEVEL_TYPE } from '../websocket/interfaces/ws.message.interfaces';

export class BaseCollection<T> implements IUpdatable<T> {
    reload(element: T[], levelType: LEVEL_TYPE = LEVEL_TYPE.ROOT, action: ACTION_TYPE = ACTION_TYPE.LOAD): Array<T> {
        throw new Error("Method not implemented.");
    }

    public type: string;
    public parentsToSync = [
    ];

    public elements: Array<T> = [];
    public onDataChangeEvent: Subject<any>;


    protected execSync(target: any, collection: any, entities: any, action: ACTION_TYPE) {
        switch (action) {
            case ACTION_TYPE.ADD:
            case ACTION_TYPE.UPDATE:
                if (target instanceof Array) {
                    if (entities && entities.length > 0) {
                        target = collection.reload(entities);
                    }
                } else if (target instanceof Object) {
                    target = collection.reload(entities)[0];

                }
                break;
            case ACTION_TYPE.DELETE:
                if (target instanceof Array) {
                    entities.forEach(entity => {
                        const indexToRemove = target.findIndex((element) => element.id === entity.id);
                        target.splice(indexToRemove, 1);
                    });
                } else if (target instanceof Object) {
                    //delete target;
                    target = undefined;
                }
                break;
        }
        return target;
    }


    public update(moduleElements: Array<T>): Array<T> {
        const updatedElement: Array<T> = [];
        moduleElements.forEach(updateData => {
            const indexToUpdate = this.elements.findIndex((element: T) => (element as any).id === (updateData as any).id);
            if (indexToUpdate !== -1) {
                this.elements[indexToUpdate] = updateData;
            } else {
                this.elements.push(updateData);
            }
            updatedElement.push(updateData);
            this.onDataChangeEvent.next(this.setParentToSync(updatedElement, this.type));
        });

        return updatedElement;
    }

    public delete(elementsToDelete: Array<string>): Array<T> {
        const deletedElement: Array<T> = [];
        elementsToDelete.forEach((id) => {
            const indexToRemove = this.elements.findIndex((element: T) => (element as any).id === id);
            if (indexToRemove !== -1) {
                deletedElement.push(this.elements[indexToRemove]);
                this.elements.splice(indexToRemove, 1);
                this.onDataChangeEvent.next(this.setParentToSync(deletedElement, this.type));
            }
        });
        return deletedElement;
    }

    // usage example:
    public onlyDistinctValue(list: Array<any>, parentName: string) {
        let listToFilter = [];
        const attributeName = parentName.charAt(0).toLowerCase() + parentName.slice(1) + 'Id';
        list.forEach(element => {
            listToFilter = listToFilter.concat(element[attributeName]);
        });
        const uniqueIds = listToFilter.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        return uniqueIds;
    }


    public setParentToSync(elementsExtractFrom, sourceType: string): any {
        const parentToSyncObject = {
            sourceType: sourceType, parents: {}
        } as any;
        this.parentsToSync.forEach(parentName => {
            parentToSyncObject.parents[parentName] = this.onlyDistinctValue(elementsExtractFrom, parentName);
        });
        return parentToSyncObject;
    }
}
