import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { InternalEventBus } from "../../../../shared/events/internal-event-bus";
import { InvalidAccessTokenError } from "../../domain/identity.errors";
import { SESSION_REPOSITORY, type SessionRepository } from "../../domain/repositories/session.repository";
import { ACCESS_TOKEN_SERVICE, type AccessTokenService } from "../ports/access-token.service";

@Injectable()
export class InvalidateSessionUseCase {
  public constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenService,
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InvalidateSessionUseCase.name);
  }

  public async execute(accessToken: string): Promise<void> {
    const payload = await this.accessTokenService.verify(accessToken);
    const session = await this.sessionRepository.findById(payload.sid);

    if (
      session === null ||
      session.status !== "active" ||
      session.jti !== payload.jti ||
      session.organizationId !== payload.oid ||
      session.isExpired(new Date())
    ) {
      throw new InvalidAccessTokenError();
    }

    const revokedSession = session.revoke(new Date());

    await this.databaseExecutor.withTransaction(async () => {
      await this.sessionRepository.update(revokedSession);
      await this.internalEventBus.publish({
        accountId: revokedSession.accountId,
        occurredAt: revokedSession.updatedAt,
        organizationId: revokedSession.organizationId,
        sessionId: revokedSession.id,
        type: "identity.logout_succeeded",
        userId: revokedSession.userId,
      });
    });

    this.logger.info(
      {
        accountId: revokedSession.accountId,
        event: "session_invalidated",
        sessionId: revokedSession.id,
        userId: revokedSession.userId,
      },
      "Identity session invalidated",
    );
  }
}
