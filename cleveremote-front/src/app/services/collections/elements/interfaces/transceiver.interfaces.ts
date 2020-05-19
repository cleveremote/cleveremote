export enum TRANSCIEVER_TYPE {
    COORDINATOR = 0,
    ROUTER = 1,
    ENDDEVICE = 2
}

export enum TRANSCIEVER_TYPE_LABEL {
    COORDINATOR = 'Coordinator',
    ROUTER = 'Router',
    ENDDEVICE = 'End Device'
}

export enum TRANSCIEVER_STATUS {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SLEEPY = 'SLEEPY',
    PENDING = 'PENDING'
}

export enum TRANSCIEVER_STATUS_LABEL {
    ACTIF = 'Actif',
    INACTIF = 'Inactif',
    SLEEPY = 'Sleepy'
}

export enum TYPE_IOCFG {
    FULL_DIGITAL_INPUT = 0,
    FULL_DIGITAL_OUTPUT_HIGH,
    FULL_DIGITAL_OUTPUT_LOW,
    FULL_ANALOG_INPUT,
    CUSTOM
}

export enum TYPE_IOCFG_LABEL {
    FULL_DIGITAL_INPUT = 'Full digital input',
    FULL_DIGITAL_OUTPUT_HIGH = 'Full digital output high',
    FULL_DIGITAL_OUTPUT_LOW = 'Full digital output low',
    FULL_ANALOG_INPUT = 'Full analog input',
    CUSTOM = 'Custom'
}

export enum TYPE_IO {
    DISABLED,
    NA,
    ANALOG_INPUT = 2,
    DIGITAL_INPUT,
    DIGITAL_OUTPUT_LOW,
    DIGITAL_OUTPUT_HIGH
}

export enum TYPE_IO_LABEL {
    DISABLED = 'Disabled',
    NA = 'Not affected',
    ANALOG_INPUT = 'Analog Sensor',
    DIGITAL_INPUT = 'State Sensor',
    DIGITAL_OUTPUT_LOW = 'Relay (initial low)',
    DIGITAL_OUTPUT_HIGH = 'Relay (initial high)'
}

