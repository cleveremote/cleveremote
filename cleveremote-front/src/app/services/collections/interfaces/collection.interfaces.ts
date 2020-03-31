import { ModuleElement } from '../elements/module.element';
import { BaseElement } from '../elements/base.element';
export interface IUpdatable<T> {
    elements: Array<T>;
    update(element: Array<T>): Array<T>;
    delete(elementsId: Array<string>): Array<T>;
    reload(element: Array<T>): void;
}
