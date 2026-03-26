import { Global, Module } from "@nestjs/common";

import { SharedEventsModule } from "./events/shared-events.module";
import { AccessControlModule } from "../modules/access-control/access-control.module";
import { IdentityModule } from "../modules/identity/identity.module";
import { OrganizationsModule } from "../modules/organizations/organizations.module";
import { UsersModule } from "../modules/users/users.module";
import { AuthenticatedRequestGuard } from "./auth/authenticated-request.guard";
import { AuthorizationGuard } from "./auth/authorization.guard";
import { ActiveTenantGuard } from "./tenancy/active-tenant.guard";
import { TenantContextGuard } from "./tenancy/tenant-context.guard";
import { TenantContextResolverService } from "./tenancy/tenant-context-resolver.service";

@Global()
@Module({
  imports: [
    SharedEventsModule,
    IdentityModule,
    OrganizationsModule,
    UsersModule,
    AccessControlModule,
  ],
  providers: [
    TenantContextResolverService,
    AuthenticatedRequestGuard,
    ActiveTenantGuard,
    TenantContextGuard,
    AuthorizationGuard,
  ],
  exports: [
    AuthenticatedRequestGuard,
    ActiveTenantGuard,
    TenantContextGuard,
    AuthorizationGuard,
  ],
})
export class SecurityModule {}
