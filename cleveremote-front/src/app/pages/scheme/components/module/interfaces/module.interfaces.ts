export enum ModuleType {
    RELAY = 0,
    SENSOR = 1
}

export interface IModuleElement {
    name: string;
    type: ModuleType;
    config: any;
    value: string;
}

export enum SourceType {
    SECTOR = 0,
    CONFIG = 1
}

export enum TYPE_IOCFG {
    FULL_DIGITAL_INPUT = 0,
    FULL_DIGITAL_OUTPUT_HIGH,
    FULL_DIGITAL_OUTPUT_LOW,
    FULL_ANALOG_INPUT,
    INIT
}
