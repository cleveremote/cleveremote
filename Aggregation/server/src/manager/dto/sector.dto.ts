import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class SectorDto {
    @IsNotEmpty()
    public id: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public schemeId: string;
}
