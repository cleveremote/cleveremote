import { IsNotEmpty, IsNumber } from "class-validator";
export class TransceiverDto {
    public id: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public description: string | null;
    @IsNotEmpty()
    public address: string;
    @IsNotEmpty()
    public type: string;
    @IsNotEmpty()
    public deviceId: string;
    @IsNotEmpty()
    public configuration: object;
}
