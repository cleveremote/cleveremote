import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class SchemeDto {
    @IsNotEmpty()
    public schemeId: string;
    @IsNotEmpty()
    public file: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public description: string;
    @IsNotEmpty()
    public parentScheme: string;
    @IsNotEmpty()
    public deviceId: string;
}
