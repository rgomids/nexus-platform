import { randomUUID } from "node:crypto";

import { Inject, Injectable, Optional } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { ApplicationMetricsService } from "../../../../bootstrap/telemetry/application-metrics.service";
import { ApplicationTelemetryService } from "../../../../bootstrap/telemetry/application-telemetry.service";
import { RequestCorrelationContext } from "../../../../shared/request-correlation/request-correlation.context";
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from "../../domain/repositories/audit-log.repository";
import {
  AuditLogEntry,
  type AuditLogAction,
  type AuditLogResource,
} from "../../domain/entities/audit-log-entry.entity";
import type { AuditLogView } from "../dto/audit-log.views";

export interface AppendAuditLogInput {
  readonly action: AuditLogAction;
  readonly metadata: Record<string, unknown>;
  readonly resource: AuditLogResource;
  readonly tenantId: string | null;
  readonly timestamp?: Date;
  readonly userId: string | null;
}

@Injectable()
export class AppendAuditLogUseCase {
  public constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepository,
    private readonly requestCorrelationContext: RequestCorrelationContext,
    private readonly logger: PinoLogger,
    @Optional()
    private readonly applicationTelemetryService?: ApplicationTelemetryService,
    @Optional()
    private readonly applicationMetricsService?: ApplicationMetricsService,
  ) {
    this.logger.setContext(AppendAuditLogUseCase.name);
  }

  public async execute(input: AppendAuditLogInput): Promise<AuditLogView> {
    const executeOperation = async (): Promise<AuditLogView> => {
      const entry = AuditLogEntry.create({
        action: input.action,
        correlationId: this.requestCorrelationContext.getCorrelationIdOrDefault(),
        id: randomUUID(),
        metadata: input.metadata,
        resource: input.resource,
        tenantId: input.tenantId,
        timestamp: input.timestamp ?? new Date(),
        userId: input.userId,
      });
      const startedAt = performance.now();

      await this.auditLogRepository.append(entry);
      this.applicationMetricsService?.recordAuditOperation({
        durationMs: performance.now() - startedAt,
        operation: "append",
      });
      this.logger.info(
        {
          action: entry.action,
          correlationId: entry.correlationId,
          event: "audit_log_appended",
          resource: entry.resource,
          tenantId: entry.tenantId,
          userId: entry.userId,
        },
        "Audit log appended",
      );

      return mapAuditLogView(entry);
    };

    if (this.applicationTelemetryService === undefined) {
      return executeOperation();
    }

    return this.applicationTelemetryService.runInSpan(
      "audit_logs.append",
      {
        "audit.action": input.action,
        "audit.resource": input.resource,
        "tenant.id": input.tenantId ?? "bootstrap",
      },
      executeOperation,
    );
  }
}

export function mapAuditLogView(entry: AuditLogEntry): AuditLogView {
  return {
    action: entry.action,
    correlationId: entry.correlationId,
    id: entry.id,
    metadata: entry.metadata,
    resource: entry.resource,
    tenantId: entry.tenantId,
    timestamp: entry.timestamp.toISOString(),
    userId: entry.userId,
  };
}
