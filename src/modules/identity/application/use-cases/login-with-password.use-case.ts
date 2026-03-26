import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { ApplicationConfigService } from "../../../../bootstrap/config/application-config.service";
import {
  ORGANIZATIONS_TENANCY_CONTRACT,
  type OrganizationsTenancyContract,
} from "../../../organizations/application/contracts/organizations-tenancy.contract";
import {
  OrganizationInactiveError,
  OrganizationNotFoundError,
} from "../../../organizations/domain/organization.errors";
import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "../../../users/application/contracts/users-identity.contract";
import {
  USERS_TENANCY_CONTRACT,
  type UsersTenancyContract,
} from "../../../users/application/contracts/users-tenancy.contract";
import { MembershipNotFoundError } from "../../../users/domain/user.errors";
import { Session } from "../../domain/entities/session.entity";
import { InvalidCredentialsError } from "../../domain/identity.errors";
import { ACCOUNT_REPOSITORY, type AccountRepository } from "../../domain/repositories/account.repository";
import {
  CREDENTIAL_REPOSITORY,
  type CredentialRepository,
} from "../../domain/repositories/credential.repository";
import { SESSION_REPOSITORY, type SessionRepository } from "../../domain/repositories/session.repository";
import { EmailAddress } from "../../domain/value-objects/email-address.value-object";
import type { AuthenticatedPrincipalDto } from "../dto/authenticated-principal.dto";
import { ACCESS_TOKEN_SERVICE, type AccessTokenService } from "../ports/access-token.service";
import { PASSWORD_HASHER, type PasswordHasher } from "../ports/password-hasher.port";
import { TenantContextRequiredError } from "../../../../shared/tenancy/tenant.errors";

export interface LoginWithPasswordInput {
  readonly email: string;
  readonly organizationId?: string;
  readonly password: string;
}

export interface LoginWithPasswordResult {
  readonly accessToken: string;
  readonly principal: Omit<AuthenticatedPrincipalDto, "sessionId">;
  readonly sessionId: string;
  readonly tokenType: "Bearer";
}

@Injectable()
export class LoginWithPasswordUseCase {
  public constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepository,
    @Inject(CREDENTIAL_REPOSITORY) private readonly credentialRepository: CredentialRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenService,
    @Inject(USERS_IDENTITY_CONTRACT)
    private readonly usersIdentityContract: UsersIdentityContract,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
    @Inject(ORGANIZATIONS_TENANCY_CONTRACT)
    private readonly organizationsTenancyContract: OrganizationsTenancyContract,
    private readonly configuration: ApplicationConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LoginWithPasswordUseCase.name);
  }

  public async execute(input: LoginWithPasswordInput): Promise<LoginWithPasswordResult> {
    const email = EmailAddress.create(input.email);
    const account = await this.accountRepository.findByEmail(email);

    if (account === null || account.status !== "active") {
      return this.failAuthentication();
    }

    const user = await this.usersIdentityContract.getUserById(account.userId);
    const credential = await this.credentialRepository.findByAccountId(account.id);

    if (user === null || user.status !== "active" || credential === null) {
      return this.failAuthentication();
    }

    const passwordMatches = await this.passwordHasher.verify(credential.passwordHash, input.password);

    if (!passwordMatches) {
      return this.failAuthentication();
    }

    const organizationId = await this.resolveOrganizationContext(user.userId, input.organizationId);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 1000 * 60 * this.configuration.auth.jwtExpiresInMinutes,
    );
    const session = Session.start({
      accountId: account.id,
      expiresAt,
      id: randomUUID(),
      jti: randomUUID(),
      now,
      organizationId,
      userId: user.userId,
    });

    await this.sessionRepository.save(session);

    const accessToken = await this.accessTokenService.issue(
      {
        aid: account.id,
        jti: session.jti,
        oid: organizationId,
        sid: session.id,
        sub: user.userId,
      },
      expiresAt,
    );

    this.logger.info(
      {
        accountId: account.id,
        event: "login_succeeded",
        sessionId: session.id,
        userId: user.userId,
      },
      "Identity login succeeded",
    );

    return {
      accessToken,
      principal: {
        accountId: account.id,
        accountStatus: account.status,
        email: account.email.normalized,
        organizationId,
        userId: user.userId,
        userStatus: user.status,
      },
      sessionId: session.id,
      tokenType: "Bearer",
    };
  }

  private failAuthentication(): never {
    this.logger.warn({ event: "login_failed" }, "Identity login failed");
    throw new InvalidCredentialsError();
  }

  private async resolveOrganizationContext(
    userId: string,
    organizationId: string | undefined,
  ): Promise<string | null> {
    const activeMembershipCount = await this.usersTenancyContract.countActiveMemberships(userId);

    if (activeMembershipCount === 0) {
      if (organizationId !== undefined) {
        throw new MembershipNotFoundError();
      }

      return null;
    }

    if (organizationId === undefined) {
      throw new TenantContextRequiredError();
    }

    const organization = await this.organizationsTenancyContract.getOrganizationById(organizationId);

    if (organization === null) {
      throw new OrganizationNotFoundError();
    }

    if (organization.status !== "active") {
      throw new OrganizationInactiveError();
    }

    const membership = await this.usersTenancyContract.findActiveMembership(userId, organizationId);

    if (membership === null) {
      throw new MembershipNotFoundError();
    }

    return organizationId;
  }
}
