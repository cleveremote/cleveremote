export class Device {
    public address64: string | ArrayBuffer;
    public address16: string | ArrayBuffer;
    public type: TRANSCIEVER_TYPE;
    public nodeIdentifier: string;
    public remoteParent16: string | ArrayBuffer;
    public digiProfileID: string | ArrayBuffer;
    public digiManufacturerID: string | ArrayBuffer;
}

export enum TRANSCIEVER_TYPE {
    COORDINATOR = 0,
    ROUTER = 1,
    ENDDEVICE = 2
}



// export enum exportCpuStatus {
//     WAIT = 'WAIT',
//     PROCESSING = 'PROCESSING',
//     EXPORTED = 'EXPORTED'
// }