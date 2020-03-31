import { IWSMessage, ELEMENT_TYPE, ACTION_TYPE } from '../../websocket/interfaces/ws.message.interfaces';
import { BaseElement } from './base.element';
import { plainToClass } from 'class-transformer';
import { ModuleElement } from './module.element';
import { ModuleCollection } from '../module.collection';
import { IUpdatable } from '../interfaces/collection.interfaces';
import { GroupViewElement } from './groupview.element';



export class ElementFactory {
    public classMapping = [
        { element: ModuleElement },
        { element: GroupViewElement }
    ];
    constructor(collectionList: Array<any>) {
        this.mapCollectionToElementType(collectionList);
    }

    public syncElements(wsMessage: IWSMessage): boolean {
        switch (wsMessage.typeAction) {
            case ACTION_TYPE.DELETE:
                this.genericDeleteSync(wsMessage);
                break;
            case ACTION_TYPE.UPDATE:
            case ACTION_TYPE.ADD:
                this.genericUpdateSync(wsMessage);
                break;
            default:
                break;
        }
        return true;
    }

    public genericUpdateSync(wsMessage: IWSMessage): void {
        const type = this.dynamicType(wsMessage.target);
        const arrayOfInstance: Array<typeof type.element> = [];
        const arrayOfObject = wsMessage.data;
        arrayOfObject.forEach(object => {
            arrayOfInstance.push(plainToClass((type.element as any), object));
        });

         (type.collection as IUpdatable<typeof type>).reload(arrayOfObject);
    }

    public genericDeleteSync(wsMessage: IWSMessage): Array<BaseElement> {
        const type = this.dynamicType(wsMessage.target);
        const arrayOfInstance: Array<typeof type.element> = [];
        const idsToDelete = wsMessage.data;
        const ids: Array<string> = [];
        idsToDelete.forEach(element => {
            ids.push(element.id);
        });

        return (type.collection as IUpdatable<typeof type>).delete(ids);
    }



    public dynamicType(entityName: string): any {
        const className = `${entityName}Element`;
        const mapper = this.classMapping.find((test: any) => test.element.name === className);
        if (!mapper) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }
        return mapper;
    }

    public mapCollectionToElementType(collectionList: any): void {
        this.classMapping.forEach(mapper => {
            const collectionName = mapper.element.name.replace('Element', 'Collection');
            const collectionInsance = collectionList.find((c: any) => c.constructor.name === collectionName);

            if (!collectionInsance) {
                throw new Error(`Collection type of \'${collectionName}\' is not in the store`);
            }
            (mapper as any).collection = collectionInsance;
        });
    }
}