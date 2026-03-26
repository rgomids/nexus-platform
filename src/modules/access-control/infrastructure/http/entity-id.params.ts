import { IsUUID } from "class-validator";

export class EntityIdParamsDto {
  @IsUUID()
  public readonly id!: string;
}
