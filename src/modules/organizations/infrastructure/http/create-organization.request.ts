import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  public readonly name!: string;
}
