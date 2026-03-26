import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { AuthenticatedPrincipal } from "../../../../shared/auth/authenticated-principal.decorator";
import { AuthenticatedRequestGuard } from "../../../../shared/auth/authenticated-request.guard";
import { AuthorizationGuard } from "../../../../shared/auth/authorization.guard";
import { RequirePermission } from "../../../../shared/auth/require-permission.decorator";
import { TenantContext } from "../../../../shared/tenancy/tenant-context.decorator";
import { ActiveTenantGuard } from "../../../../shared/tenancy/active-tenant.guard";
import type { TenantContextSnapshot } from "../../../../shared/auth/request-context.types";
import type { AuthenticatedPrincipalDto } from "../../../identity/application/dto/authenticated-principal.dto";
import { AssignRoleToUserUseCase } from "../../application/use-cases/assign-role-to-user.use-case";
import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import { GrantPermissionToRoleUseCase } from "../../application/use-cases/grant-permission-to-role.use-case";
import { ListPermissionsUseCase } from "../../application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";
import { AssignUserRoleRequestDto } from "./assign-user-role.request";
import { CreateRoleRequestDto } from "./create-role.request";
import { EntityIdParamsDto } from "./entity-id.params";
import { GrantRolePermissionRequestDto } from "./grant-role-permission.request";

@Controller()
@UseGuards(AuthenticatedRequestGuard, ActiveTenantGuard, AuthorizationGuard)
export class AccessControlController {
  public constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
    private readonly grantPermissionToRoleUseCase: GrantPermissionToRoleUseCase,
    private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
  ) {}

  @Post("roles")
  @RequirePermission("role:create")
  public createRole(
    @Body() body: CreateRoleRequestDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
    @TenantContext() tenantContext: TenantContextSnapshot,
  ) {
    return this.createRoleUseCase.execute({
      actorUserId: principal.userId,
      name: body.name,
      organizationId: tenantContext.organizationId,
    });
  }

  @Get("roles")
  @RequirePermission("role:view")
  public listRoles(@TenantContext() tenantContext: TenantContextSnapshot) {
    return this.listRolesUseCase.execute(tenantContext.organizationId);
  }

  @Get("permissions")
  @RequirePermission("permission:view")
  public listPermissions(@TenantContext() tenantContext: TenantContextSnapshot) {
    return this.listPermissionsUseCase.execute(tenantContext.organizationId);
  }

  @Post("roles/:id/permissions")
  @RequirePermission("role:grant-permission")
  public grantPermissionToRole(
    @Param() params: EntityIdParamsDto,
    @Body() body: GrantRolePermissionRequestDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
    @TenantContext() tenantContext: TenantContextSnapshot,
  ) {
    return this.grantPermissionToRoleUseCase.execute({
      actorUserId: principal.userId,
      organizationId: tenantContext.organizationId,
      permissionCode: body.permissionCode,
      roleId: params.id,
    });
  }

  @Post("users/:id/roles")
  @RequirePermission("role:assign")
  public assignRoleToUser(
    @Param() params: EntityIdParamsDto,
    @Body() body: AssignUserRoleRequestDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
    @TenantContext() tenantContext: TenantContextSnapshot,
  ) {
    return this.assignRoleToUserUseCase.execute({
      actorUserId: principal.userId,
      organizationId: tenantContext.organizationId,
      roleId: body.roleId,
      userId: params.id,
    });
  }
}
