import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAccountRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  public readonly fullName!: string;

  @IsEmail()
  public readonly email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public readonly password!: string;
}
