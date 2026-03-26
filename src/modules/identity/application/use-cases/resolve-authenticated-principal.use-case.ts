import { Inject, Injectable } from "@nestjs/common";

import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "../../../users/application/contracts/users-identity.contract";
import { InvalidCredentialsError, InvalidAccessTokenError } from "../../domain/identity.errors";
import { ACCOUNT_REPOSITORY, type AccountRepository } from "../../domain/repositories/account.repository";
import { SESSION_REPOSITORY, type SessionRepository } from "../../domain/repositories/session.repository";
import type { AuthenticatedPrincipalDto } from "../dto/authenticated-principal.dto";
import { ACCESS_TOKEN_SERVICE, type AccessTokenService } from "../ports/access-token.service";

@Injectable()
export class ResolveAuthenticatedPrincipalUseCase {
  public constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepository,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenService,
    @Inject(USERS_IDENTITY_CONTRACT)
    private readonly usersIdentityContract: UsersIdentityContract,
  ) {}

  public async execute(accessToken: string): Promise<AuthenticatedPrincipalDto> {
    const payload = await this.accessTokenService.verify(accessToken);
    const session = await this.sessionRepository.findById(payload.sid);

    if (
      session === null ||
      session.status !== "active" ||
      session.jti !== payload.jti ||
      session.isExpired(new Date())
    ) {
      throw new InvalidAccessTokenError();
    }

    const account = await this.accountRepository.findById(session.accountId);
    const user = await this.usersIdentityContract.getUserById(session.userId);

    if (account === null || user === null || account.status !== "active" || user.status !== "active") {
      throw new InvalidCredentialsError();
    }

    return {
      accountId: account.id,
      accountStatus: account.status,
      email: account.email.normalized,
      sessionId: session.id,
      userId: user.userId,
      userStatus: user.status,
    };
  }
}
