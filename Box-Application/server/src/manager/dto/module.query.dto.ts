import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class ModuleQueryDto {
    @IsOptional()
    public moduleId: string;
    @IsOptional()
    public port: string;
    @IsOptional()
    public status: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public transceiverId: string;
    @IsOptional()
    public sectorId: string;
}
