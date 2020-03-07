export class SleepCfg {
    public SM: number;
    public SN: number;
    public SP: number;
    public ST: number;


    public decodeInput(data): void {
        if (data.remote64) {
            this.SM = data.SM.commandData;
            this.ST = data.ST.commandData;
        }
        this.SP = data.SP.commandData;
        this.SN = data.SN.commandData;
    }
}
