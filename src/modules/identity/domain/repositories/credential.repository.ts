import type { Credential } from "../entities/credential.entity";

export const CREDENTIAL_REPOSITORY = Symbol("CREDENTIAL_REPOSITORY");

export interface CredentialRepository {
  findByAccountId(accountId: string): Promise<Credential | null>;
  save(credential: Credential): Promise<void>;
}
