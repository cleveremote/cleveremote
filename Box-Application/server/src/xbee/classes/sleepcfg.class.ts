import { XbeeHelper } from "../helpers/xbee.helper";

export enum TYPE_SLEEPCFG {
    INITIAL = 0,
    ROUTER = 1
}

export class SleepCfg {
    public SM: number;
    public SN: number;
    public SP: number;
    public ST: number;


    public setConfig(data): void {
        this.SM = data.SM && XbeeHelper.byteArrayToNumber(data.SM.commandData);
        this.ST = data.ST && XbeeHelper.byteArrayToNumber(data.ST.commandData);
        this.SP = XbeeHelper.byteArrayToNumber(data.SP.commandData);
        this.SN = XbeeHelper.byteArrayToNumber(data.SN.commandData);
    }

    public getConfig(): any {
        const config = {} as any;
        config.SM = this.SM && XbeeHelper.numberToBytes(this.SM);
        config.ST = this.ST && XbeeHelper.numberToBytes(this.ST);
        config.SP = this.SP && XbeeHelper.numberToBytes(this.SP);
        config.SN = this.SN && XbeeHelper.numberToBytes(this.SN);
        return config;
    }

    constructor(type: TYPE_SLEEPCFG, maxSP: number, maxSN: number) {
        switch (type) {
            case TYPE_SLEEPCFG.INITIAL:
                this.getInitialSleepCfg(maxSP, maxSN);
                break;
            default:
                break;
        }
    }
    public getInitialSleepCfg(maxSP: number, maxSN: number): void {
        this.SM = 0;     // always new device is router
        this.ST = 5000;  // 5 seconde
        this.SP = maxSP; // default * 100ms
        this.SN = maxSN; // get from current configuration
    }
}
