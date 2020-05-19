export enum ELEMENT_TYPE {
    MODULE = 'Module',
    TRANSCEIVER = 'Transceiver',
    GROUPVIEW = 'GroupView',
    VALUE = 'Value',
    SECTOR = 'Sector',
    NETWORK = 'Network',
    CONNECTIVITY = 'Connectivity'
}

export enum SYNC_ACTION {
    NONE = 'NONE',
    DELETE = 'DELETE',
    SAVE = 'SAVE',
    GET = 'GET',
    NOTIFY = 'NOTIFY',
    CONNECTIVITY = 'CONNECTIVITY',
    LIVEREFRESH = 'LIVEREFRESH'
}

export interface IWSMessage {
    target: ELEMENT_TYPE;
    typeAction: SYNC_ACTION,
    data: any;
    date: Date;
}