import { IsOptional } from "class-validator";

export class AccountQueryDto {
    @IsOptional()
    public id: string;
    @IsOptional()
    public name: string;
    @IsOptional()
    public description: string | null;
}
