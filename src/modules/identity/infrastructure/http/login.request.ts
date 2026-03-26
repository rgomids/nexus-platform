import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class LoginRequestDto {
  @IsEmail()
  public readonly email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public readonly password!: string;

  @IsOptional()
  @IsUUID()
  public readonly organizationId?: string;
}
