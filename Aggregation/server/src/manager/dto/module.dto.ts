import { IsNotEmpty, IsNumber } from "class-validator";
export class ModuleDto {
    public moduleId: string;
    @IsNotEmpty()
    public port: string;
    @IsNotEmpty()
    public status: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public transceiverId: string;

}

