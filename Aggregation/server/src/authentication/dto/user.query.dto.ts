import { IsOptional } from "class-validator";

export class UserQueryDto {
    public userId: string;
    @IsOptional()
    public firstName: string;
    @IsOptional()
    public lastName: string;
    @IsOptional()
    public accountId: string;
    @IsOptional()
    public email: string;
    @IsOptional()
    public phone: string;
    @IsOptional()
    public password: string;
}
