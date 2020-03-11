import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class SchemeQueryDto {
    @IsOptional()
    public schemeId: string;
    @IsOptional()
    public file: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public description: string;
    @IsOptional()
    public parentScheme: string;
    @IsOptional()
    public deviceId: string;
}
