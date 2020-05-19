import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ModuleDto } from "./module.dto";
export class TransceiverDto {
    public id: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public description: string | null;
    @IsNotEmpty()
    public address: string;
    @IsNotEmpty()
    public type: number;
    public status: string; //???
    @IsNotEmpty()
    public deviceId: string;
    @IsNotEmpty()
    public configuration: object;
    @IsOptional()
    public modules: Array<ModuleDto>;
    @IsOptional()
    public pending: TransceiverDto;
    
}
