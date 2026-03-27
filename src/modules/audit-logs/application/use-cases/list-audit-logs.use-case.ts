import { Inject, Injectable, Optional } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { ApplicationMetricsService } from "../../../../bootstrap/telemetry/application-metrics.service";
import { ApplicationTelemetryService } from "../../../../bootstrap/telemetry/application-telemetry.service";
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
  readonly limit: number;
  readonly offset: number;
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
    @Optional()
    private readonly applicationTelemetryService?: ApplicationTelemetryService,
    @Optional()
    private readonly applicationMetricsService?: ApplicationMetricsService,
  ) {
    this.logger.setContext(ListAuditLogsUseCase.name);
  }

  public async execute(input: ListAuditLogsInput): Promise<AuditLogView[]> {
    const executeOperation = async (): Promise<AuditLogView[]> => {
      if (input.from !== undefined && input.to !== undefined && input.from > input.to) {
        throw new InvalidAuditLogTimeRangeError();
      }

      const startedAt = performance.now();
      const entries = await this.auditLogRepository.list(input);

      this.applicationMetricsService?.recordAuditOperation({
        durationMs: performance.now() - startedAt,
        operation: "query",
      });
      this.logger.info(
        {
          action: input.action,
          event: "audit_log_query",
          from: input.from?.toISOString(),
          limit: input.limit,
          offset: input.offset,
          resultCount: entries.length,
          tenantId: input.tenantId,
          to: input.to?.toISOString(),
          userId: input.userId,
        },
        "Audit log query completed",
      );

      return entries.map((entry) => mapAuditLogView(entry));
    };

    if (this.applicationTelemetryService === undefined) {
      return executeOperation();
    }

    return this.applicationTelemetryService.runInSpan(
      "audit_logs.list",
      {
        "audit.action": input.action ?? "all",
        "audit.limit": input.limit,
        "audit.offset": input.offset,
        "tenant.id": input.tenantId,
      },
      executeOperation,
    );
  }
}
