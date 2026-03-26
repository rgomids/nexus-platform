import type { Account } from "../entities/account.entity";
import type { EmailAddress } from "../value-objects/email-address.value-object";

export const ACCOUNT_REPOSITORY = Symbol("ACCOUNT_REPOSITORY");

export interface AccountRepository {
  findByEmail(email: EmailAddress): Promise<Account | null>;
  findById(accountId: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
}
