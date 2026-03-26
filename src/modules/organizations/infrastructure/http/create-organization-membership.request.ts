import { IsUUID } from "class-validator";

export class CreateOrganizationMembershipRequestDto {
  @IsUUID()
  public readonly userId!: string;
}
