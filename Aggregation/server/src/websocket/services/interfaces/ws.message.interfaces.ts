export enum ELEMENT_TYPE {
    MODULE = 'Module',
    TRANSCEIVER = 'Transceiver',
    GROUPVIEW = 'GroupView',
    VALUE = 'Value',
    SECTOR = 'Sector',
    NETWORK = 'Network'
}

export enum ACTION_TYPE {
    ADD = 'ADD',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    CONNECTIVITY = 'CONNECTIVITY',
    LIVEREFRESH = 'LIVEREFRESH'
}

export interface IWSMessage {
    target: ELEMENT_TYPE;
    typeAction: ACTION_TYPE,
    data: any;
    date: Date;
}