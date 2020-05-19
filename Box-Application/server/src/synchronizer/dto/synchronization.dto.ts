import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class SynchronizationQueryDto {
    @IsOptional()
    public target: string;
    @IsOptional()
    public topic: string;
    @IsOptional()
    public entity: string;
    @IsOptional()
    public entityId: string;
    @IsOptional()
    public action: string;
    @IsOptional()
    public data: object;
    @IsOptional()
    public size: number;
}
