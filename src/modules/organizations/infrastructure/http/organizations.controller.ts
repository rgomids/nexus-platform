import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthenticatedPrincipal } from "../../../../shared/auth/authenticated-principal.decorator";
import { AuthenticatedRequestGuard } from "../../../../shared/auth/authenticated-request.guard";
import { AuthorizationGuard } from "../../../../shared/auth/authorization.guard";
import { RequirePermission } from "../../../../shared/auth/require-permission.decorator";
import type { AuthenticatedPrincipalDto } from "../../../identity/application/dto/authenticated-principal.dto";
import { TenantContextGuard } from "../../../../shared/tenancy/tenant-context.guard";
import { CreateOrganizationMembershipUseCase } from "../../application/use-cases/create-organization-membership.use-case";
import { CreateOrganizationUseCase } from "../../application/use-cases/create-organization.use-case";
import { DeactivateOrganizationUseCase } from "../../application/use-cases/deactivate-organization.use-case";
import { GetOrganizationByIdUseCase } from "../../application/use-cases/get-organization-by-id.use-case";
import { ListOrganizationMembershipsUseCase } from "../../application/use-cases/list-organization-memberships.use-case";
import { CreateOrganizationMembershipRequestDto } from "./create-organization-membership.request";
import { CreateOrganizationRequestDto } from "./create-organization.request";
import { OrganizationIdParamsDto } from "./organization-id.params";

@Controller("organizations")
export class OrganizationsController {
  public constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
    private readonly deactivateOrganizationUseCase: DeactivateOrganizationUseCase,
    private readonly createOrganizationMembershipUseCase: CreateOrganizationMembershipUseCase,
    private readonly listOrganizationMembershipsUseCase: ListOrganizationMembershipsUseCase,
  ) {}

  @Post()
  @UseGuards(AuthenticatedRequestGuard)
  public createOrganization(
    @Body() body: CreateOrganizationRequestDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
  ) {
    return this.createOrganizationUseCase.execute({
      createdByUserId: principal.userId,
      name: body.name,
    });
  }

  @Get(":id")
  @UseGuards(AuthenticatedRequestGuard, TenantContextGuard, AuthorizationGuard)
  @RequirePermission("organization:view")
  public getOrganization(@Param() params: OrganizationIdParamsDto) {
    return this.getOrganizationByIdUseCase.execute(params.id);
  }

  @Patch(":id/inactive")
  @UseGuards(AuthenticatedRequestGuard, TenantContextGuard, AuthorizationGuard)
  @RequirePermission("organization:deactivate")
  public deactivateOrganization(
    @Param() params: OrganizationIdParamsDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
  ) {
    return this.deactivateOrganizationUseCase.execute({
      actorUserId: principal.userId,
      organizationId: params.id,
    });
  }

  @Post(":id/memberships")
  @UseGuards(AuthenticatedRequestGuard, TenantContextGuard, AuthorizationGuard)
  @RequirePermission("membership:create")
  public createMembership(
    @Param() params: OrganizationIdParamsDto,
    @Body() body: CreateOrganizationMembershipRequestDto,
    @AuthenticatedPrincipal() principal: AuthenticatedPrincipalDto,
  ) {
    return this.createOrganizationMembershipUseCase.execute({
      actorUserId: principal.userId,
      organizationId: params.id,
      userId: body.userId,
    });
  }

  @Get(":id/memberships")
  @UseGuards(AuthenticatedRequestGuard, TenantContextGuard, AuthorizationGuard)
  @RequirePermission("membership:view")
  public listMemberships(@Param() params: OrganizationIdParamsDto) {
    return this.listOrganizationMembershipsUseCase.execute(params.id);
  }
}
