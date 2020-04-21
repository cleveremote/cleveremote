import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
export class ModuleDto {
    public id: string;
    @IsNotEmpty()
    public port: string;
    @IsNotEmpty()
    public status: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public transceiverId: string;
    @IsOptional()
    public value: string;

}

