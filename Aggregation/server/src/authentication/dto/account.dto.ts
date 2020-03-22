import { IsNotEmpty } from "class-validator";

export class AccountDto {
    public accountId: string;
    @IsNotEmpty()
    public name: string;
    @IsNotEmpty()
    public description: string | null;
}
