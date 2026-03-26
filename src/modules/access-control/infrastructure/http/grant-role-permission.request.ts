import { IsString, Matches } from "class-validator";

export class GrantRolePermissionRequestDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/)
  public readonly permissionCode!: string;
}
