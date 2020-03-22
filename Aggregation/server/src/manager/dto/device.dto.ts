import { IsNotEmpty, IsNumber } from "class-validator";
export class DeviceDto {
    public deviceId: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public description: string | null;
    public accountId: string;
}
