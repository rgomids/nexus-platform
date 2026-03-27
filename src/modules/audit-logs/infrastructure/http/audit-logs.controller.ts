import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { AuthenticatedRequestGuard } from "../../../../shared/auth/authenticated-request.guard";
import { AuthorizationGuard } from "../../../../shared/auth/authorization.guard";
import { RequirePermission } from "../../../../shared/auth/require-permission.decorator";
import { TenantContext } from "../../../../shared/tenancy/tenant-context.decorator";
import { ActiveTenantGuard } from "../../../../shared/tenancy/active-tenant.guard";
import type { TenantContextSnapshot } from "../../../../shared/auth/request-context.types";
import { TenantContextDeniedError } from "../../../../shared/tenancy/tenant.errors";
import type { ListAuditLogsInput } from "../../application/use-cases/list-audit-logs.use-case";
import { ListAuditLogsUseCase } from "../../application/use-cases/list-audit-logs.use-case";
import { ListAuditLogsRequestDto } from "./list-audit-logs.request";

@Controller("audit-logs")
@UseGuards(AuthenticatedRequestGuard, ActiveTenantGuard, AuthorizationGuard)
export class AuditLogsController {
  public constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  @Get()
  @RequirePermission("audit:view")
  public listAuditLogs(
    @Query() query: ListAuditLogsRequestDto,
    @TenantContext() tenantContext: TenantContextSnapshot,
  ) {
    if (query.tenantId !== tenantContext.organizationId) {
      throw new TenantContextDeniedError();
    }

    const input = {
      ...(query.action === undefined ? {} : { action: query.action }),
      ...(query.from === undefined ? {} : { from: new Date(query.from) }),
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      tenantId: query.tenantId,
      ...(query.to === undefined ? {} : { to: new Date(query.to) }),
      ...(query.userId === undefined ? {} : { userId: query.userId }),
    } satisfies ListAuditLogsInput;

    return this.listAuditLogsUseCase.execute(input);
  }
}
