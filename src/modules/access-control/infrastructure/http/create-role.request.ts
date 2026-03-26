import { IsString, Length } from "class-validator";

export class CreateRoleRequestDto {
  @IsString()
  @Length(3, 120)
  public readonly name!: string;
}
