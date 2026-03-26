import { IsUUID } from "class-validator";

export class OrganizationIdParamsDto {
  @IsUUID()
  public readonly id!: string;
}
