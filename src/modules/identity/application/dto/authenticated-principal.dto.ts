import type { AccountStatus } from "../../domain/entities/account.entity";
import type { UserStatus } from "../../../users/domain/entities/user.entity";

export interface AuthenticatedPrincipalDto {
  readonly accountId: string;
  readonly email: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly accountStatus: AccountStatus;
  readonly userStatus: UserStatus;
}
