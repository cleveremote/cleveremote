import { IsNotEmpty, IsNumber } from "class-validator";
export class ScanDto {
    @IsNotEmpty()
    public param1: string;

    @IsNumber()
    public param2: number;
}