import { IsUUID } from "class-validator";

export class AssignUserRoleRequestDto {
  @IsUUID()
  public readonly roleId!: string;
}
