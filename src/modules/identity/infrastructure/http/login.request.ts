import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginRequestDto {
  @IsEmail()
  public readonly email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public readonly password!: string;
}
