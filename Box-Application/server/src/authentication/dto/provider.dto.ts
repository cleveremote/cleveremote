import { IsNotEmpty } from "class-validator";

export class ProvideryDto {
    public providerId: string;
    @IsNotEmpty()
    public userId: string;
    @IsNotEmpty()
    public provider: string;
    @IsNotEmpty()
    public providerUid: string;
}
