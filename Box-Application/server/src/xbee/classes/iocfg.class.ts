export class IOCfg {
    public D1: { params?: Array<number> };
    public D2: { params?: Array<number> };
    public D3: { params?: Array<number> };
    public D4: { params?: Array<number> };
    public P0: { params?: Array<number> };
    public P1: { params?: Array<number> };


    constructor(type: TYPE_IOCFG) {
        switch (type) {
            case TYPE_IOCFG.FULL_ANALOG_INPUT:
                this.getFullAnalog();
                break;
            case TYPE_IOCFG.FULL_DIGITAL_INPUT:
                this.getFullDigital(true);
                break;
            case TYPE_IOCFG.FULL_DIGITAL_OUTPUT_HIGH:
                this.getFullDigital(false, true);
                break;
            case TYPE_IOCFG.FULL_DIGITAL_OUTPUT_LOW:
                this.getFullDigital(false, false);
                break;
            case TYPE_IOCFG.INIT:
                this.D1.params = [];
                this.D2.params = [];
                this.D3.params = [];
                this.D4.params = [];
                this.P0.params = [];
                this.P1.params = [];
                break;
            default:
                break;
        }

    }

    public getFullDigital(isInput: boolean, isHigh?: boolean): void {
        const param = isInput ? [TYPE_IO.DIGITAL_INPUT] : isHigh ? [TYPE_IO.DIGITAL_OUTPUT_HIGH] : [TYPE_IO.DIGITAL_OUTPUT_LOW];
        this.D1.params = param;
        this.D2.params = param;
        this.D3.params = param;
        this.D4.params = param;
        this.P0.params = param;
        this.P1.params = param;
    }

    public getFullAnalog(): void {
        const param = [TYPE_IO.ANALOG_INPUT];
        this.D1.params = param;
        this.D2.params = param;
        this.D3.params = param;
        this.D4.params = [];
        this.P0.params = [];
        this.P1.params = [];
    }

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
