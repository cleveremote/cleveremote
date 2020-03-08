import { IsNotEmpty, IsNumber } from "class-validator";
export class TestDto {
    @IsNotEmpty()
    public message: any;
}