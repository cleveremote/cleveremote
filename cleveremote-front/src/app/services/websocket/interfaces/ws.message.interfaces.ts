
export enum ELEMENT_TYPE {
    MODULE = 'Module',
    TRANSCEIVER = 'Transceiver'
}

export enum LEVEL_TYPE {
    ROOT = 'ROOT',
    DEVICE = 'Device',
    MODULE = 'Module',
    TRANSCEIVER = 'Transceiver',
    GROUPVIEW = 'GroupView',
    SCHEME = 'Scheme',
    USER = 'User'
}

export enum ACTION_TYPE {
    LOAD = 'LOAD',
    ADD = 'ADD',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}

export interface IWSMessage {
    target: ELEMENT_TYPE;
    typeAction: ACTION_TYPE,
    data: any;
    date: Date;
}
