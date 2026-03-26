import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { InvalidAuditLogTimeRangeError } from "../../domain/audit-log.errors";
import type { AuditLogAction } from "../../domain/entities/audit-log-entry.entity";
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from "../../domain/repositories/audit-log.repository";
import type { AuditLogView } from "../dto/audit-log.views";
import { mapAuditLogView } from "./append-audit-log.use-case";

export interface ListAuditLogsInput {
  readonly action?: AuditLogAction;
  readonly from?: Date;
  readonly tenantId: string;
  readonly to?: Date;
  readonly userId?: string;
}

@Injectable()
export class ListAuditLogsUseCase {
  public constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ListAuditLogsUseCase.name);
  }

  public async execute(input: ListAuditLogsInput): Promise<AuditLogView[]> {
    if (input.from !== undefined && input.to !== undefined && input.from > input.to) {
      throw new InvalidAuditLogTimeRangeError();
    }

    const entries = await this.auditLogRepository.list(input);

    this.logger.info(
      {
        action: input.action,
        event: "audit_log_query",
        from: input.from?.toISOString(),
        resultCount: entries.length,
        tenantId: input.tenantId,
        to: input.to?.toISOString(),
        userId: input.userId,
      },
      "Audit log query completed",
    );

    return entries.map((entry) => mapAuditLogView(entry));
  }
}
