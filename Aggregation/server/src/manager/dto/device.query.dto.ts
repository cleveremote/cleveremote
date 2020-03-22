import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class DeviceQueryDto {
    @IsOptional()
    public deviceId: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public description: string | null;
    @IsOptional()
    public accountId: string;
}
