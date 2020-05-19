export class Device {
    public address64: string | ArrayBuffer;
    public address16: string | ArrayBuffer;
    public type: TRANSCIEVER_TYPE;
    public nodeIdentifier?: string;
    public remoteParent16?: string | ArrayBuffer;
    public digiProfileID?: string | ArrayBuffer;
    public digiManufacturerID?: string | ArrayBuffer;
    public status: TRANSCIEVER_STATUS;
    public lastSeen: Date;
    public powerSupply: number;
}

export enum TRANSCIEVER_TYPE {
    COORDINATOR = 0,
    ROUTER = 1,
    ENDDEVICE = 2
}

export enum TRANSCIEVER_STATUS {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SLEEPY = 'SLEEPY',
    PENDING = 'PENDING'
}