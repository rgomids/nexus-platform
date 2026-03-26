import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { ApplicationConfigService } from "../../../../bootstrap/config/application-config.service";
import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import type { NexusError } from "../../../../shared/domain/nexus.errors";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
import { TenantContextRequiredError } from "../../../../shared/tenancy/tenant.errors";
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
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LoginWithPasswordUseCase.name);
  }

  public async execute(input: LoginWithPasswordInput): Promise<LoginWithPasswordResult> {
    const email = EmailAddress.create(input.email);
    let failedUserId: string | null = null;

    try {
      const account = await this.accountRepository.findByEmail(email);

      if (account === null || account.status !== "active") {
        throw new InvalidCredentialsError();
      }

      const user = await this.usersIdentityContract.getUserById(account.userId);
      const credential = await this.credentialRepository.findByAccountId(account.id);

      if (user === null || user.status !== "active" || credential === null) {
        throw new InvalidCredentialsError();
      }

      failedUserId = user.userId;

      const passwordMatches = await this.passwordHasher.verify(
        credential.passwordHash,
        input.password,
      );

      if (!passwordMatches) {
        throw new InvalidCredentialsError();
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

      await this.databaseExecutor.withTransaction(async () => {
        await this.sessionRepository.save(session);
        await this.internalEventBus.publish({
          accountId: account.id,
          occurredAt: now,
          organizationId,
          sessionId: session.id,
          type: "identity.login_succeeded",
          userId: user.userId,
        });
      });

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
    } catch (error) {
      if (this.isAuditableLoginFailure(error)) {
        await this.publishLoginFailureAudit({
          email: email.normalized,
          organizationId: input.organizationId ?? null,
          reason: this.readErrorCode(error),
          userId: failedUserId,
        });
      }

      throw error;
    }
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

  private isAuditableLoginFailure(error: unknown): boolean {
    return (
      error instanceof InvalidCredentialsError ||
      error instanceof MembershipNotFoundError ||
      error instanceof OrganizationInactiveError ||
      error instanceof OrganizationNotFoundError ||
      error instanceof TenantContextRequiredError
    );
  }

  private async publishLoginFailureAudit(input: {
    readonly email: string;
    readonly organizationId: string | null;
    readonly reason: string;
    readonly userId: string | null;
  }): Promise<void> {
    this.logger.warn(
      {
        event: "login_failed",
        organizationId: input.organizationId,
        reason: input.reason,
        userId: input.userId,
      },
      "Identity login failed",
    );

    try {
      await this.internalEventBus.publish({
        email: input.email,
        occurredAt: new Date(),
        organizationId: input.organizationId,
        reason: input.reason,
        type: "identity.login_failed",
        userId: input.userId,
      });
    } catch (auditError) {
      this.logger.error(
        {
          err: auditError,
          event: "error",
          failedAuditEvent: "login_failed",
          organizationId: input.organizationId,
          reason: input.reason,
          userId: input.userId,
        },
        "Failed to append audit log for login failure",
      );
    }
  }

  private readErrorCode(error: unknown): string {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as NexusError).code === "string"
    ) {
      return (error as NexusError).code;
    }

    return "unknown_error";
  }
}
