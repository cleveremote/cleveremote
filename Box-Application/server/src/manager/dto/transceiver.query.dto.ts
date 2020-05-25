import { IsOptional } from "class-validator";
export class TransceiverQueryDto {
    @IsOptional()
    public id: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public description: string | null;
    @IsOptional()
    public address: string;
    @IsOptional()
    public type: string;
    @IsOptional()
    public deviceId: string;
    @IsOptional()
    public configuration: string;
}
