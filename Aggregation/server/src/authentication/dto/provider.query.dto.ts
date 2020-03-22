import { IsOptional } from "class-validator";

export class ProviderQueryDto {
    @IsOptional()
    public providerId: string;
    @IsOptional()
    public userId: string;
    @IsOptional()
    public provider: string;
    @IsOptional()
    public providerUid: string;
}
