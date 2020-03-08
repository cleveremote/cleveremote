import { IsNotEmpty, IsNumber } from "class-validator";
export class MessageDto {
    @IsNotEmpty()
    public message: any;
}