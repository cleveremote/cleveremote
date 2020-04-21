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

export class IOCfg {
    public D1: Array<number>;
    public D2: Array<number>;
    public D3: Array<number>;
    public D4: Array<number>;
    public P1: Array<number>;
    public P2: Array<number>;


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
                this.D1 =  [] ;
                this.D2 =  [] ;
                this.D3 =  [] ;
                this.D4 =  [] ;
                this.P1 =  [] ;
                this.P2 =  [] ;
                break;
            default:
                break;
        }

    }

    public getFullDigital(isInput: boolean, isHigh?: boolean): void {
        const param = isInput ? [TYPE_IO.DIGITAL_INPUT] : isHigh ? [TYPE_IO.DIGITAL_OUTPUT_HIGH] : [TYPE_IO.DIGITAL_OUTPUT_LOW];
        this.D1 = param;
        this.D2 = param;
        this.D3 = param;
        this.D4 = param;
        this.P1 = param;
        this.P2 = param;
    }

    public getFullAnalog(): void {
        const param = [TYPE_IO.ANALOG_INPUT];
        this.D1 = param;
        this.D2 = param;
        this.D3 = param;
        this.D4 = [];
        this.P1 = [];
        this.P2 = [];
    }

}