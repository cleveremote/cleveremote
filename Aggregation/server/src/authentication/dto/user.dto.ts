import { IsNotEmpty, IsNumber } from "class-validator";
export class UserDto {
    public userId: string;
    @IsNotEmpty()
    public firstName: string;
    @IsNotEmpty()
    public lastName: string;
    @IsNotEmpty()
    public accountId: string;
    @IsNotEmpty()
    public email: string;
    @IsNotEmpty()
    public phone: string;
    @IsNotEmpty()
    public password: string;
}
