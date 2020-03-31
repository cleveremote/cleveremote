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

export enum TYPE_IO {
    ANALOG_INPUT = 2,
    DIGITAL_INPUT,
    DIGITAL_OUTPUT_LOW,
    DIGITAL_OUTPUT_HIGH
}

export enum TYPE_MODULE {
    RELAY = 0,
    SENSOR = 1
}
