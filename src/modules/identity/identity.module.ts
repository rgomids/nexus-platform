import { forwardRef, Module } from "@nestjs/common";

import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import { ACCESS_TOKEN_SERVICE } from "./application/ports/access-token.service";
import { PASSWORD_HASHER } from "./application/ports/password-hasher.port";
import { CreateUserAccountUseCase } from "./application/use-cases/create-user-account.use-case";
import { InvalidateSessionUseCase } from "./application/use-cases/invalidate-session.use-case";
import { LoginWithPasswordUseCase } from "./application/use-cases/login-with-password.use-case";
import { ResolveAuthenticatedPrincipalUseCase } from "./application/use-cases/resolve-authenticated-principal.use-case";
import { ACCOUNT_REPOSITORY } from "./domain/repositories/account.repository";
import { CREDENTIAL_REPOSITORY } from "./domain/repositories/credential.repository";
import { SESSION_REPOSITORY } from "./domain/repositories/session.repository";
import { CredentialPolicyService } from "./domain/services/credential-policy.service";
import { IdentityController } from "./infrastructure/http/identity.controller";
import { PgAccountRepository } from "./infrastructure/persistence/pg-account.repository";
import { PgCredentialRepository } from "./infrastructure/persistence/pg-credential.repository";
import { PgSessionRepository } from "./infrastructure/persistence/pg-session.repository";
import { Argon2PasswordHasher } from "./infrastructure/security/argon2-password-hasher";
import { JwtAccessTokenService } from "./infrastructure/security/jwt-access-token.service";

@Module({
  controllers: [IdentityController],
  imports: [UsersModule, forwardRef(() => OrganizationsModule)],
  providers: [
    CredentialPolicyService,
    CreateUserAccountUseCase,
    LoginWithPasswordUseCase,
    ResolveAuthenticatedPrincipalUseCase,
    InvalidateSessionUseCase,
    PgAccountRepository,
    PgCredentialRepository,
    PgSessionRepository,
    Argon2PasswordHasher,
    JwtAccessTokenService,
    {
      provide: ACCOUNT_REPOSITORY,
      useExisting: PgAccountRepository,
    },
    {
      provide: CREDENTIAL_REPOSITORY,
      useExisting: PgCredentialRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useExisting: PgSessionRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2PasswordHasher,
    },
    {
      provide: ACCESS_TOKEN_SERVICE,
      useExisting: JwtAccessTokenService,
    },
  ],
  exports: [ResolveAuthenticatedPrincipalUseCase],
})
export class IdentityModule {}
