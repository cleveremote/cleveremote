import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class SectorQueryDto {
    @IsOptional()
    public sectorId: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public schemeId: string;
}
