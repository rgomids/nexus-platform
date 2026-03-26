import { Module } from "@nestjs/common";

import { SharedEventsModule } from "../../shared/events/shared-events.module";
import { AppendAuditLogUseCase } from "./application/use-cases/append-audit-log.use-case";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import {
  AUDIT_LOG_REPOSITORY,
} from "./domain/repositories/audit-log.repository";
import { AuditLogsController } from "./infrastructure/http/audit-logs.controller";
import { PgAuditLogRepository } from "./infrastructure/persistence/pg-audit-log.repository";
import { AuditLogSubscribers } from "./application/audit-log.subscribers";

@Module({
  controllers: [AuditLogsController],
  imports: [SharedEventsModule],
  providers: [
    AppendAuditLogUseCase,
    ListAuditLogsUseCase,
    AuditLogSubscribers,
    PgAuditLogRepository,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useExisting: PgAuditLogRepository,
    },
  ],
})
export class AuditLogsModule {}
