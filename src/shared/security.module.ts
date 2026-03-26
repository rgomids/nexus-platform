import { Global, Module } from "@nestjs/common";

import { IdentityModule } from "../modules/identity/identity.module";
import { OrganizationsModule } from "../modules/organizations/organizations.module";
import { UsersModule } from "../modules/users/users.module";
import { AuthenticatedRequestGuard } from "./auth/authenticated-request.guard";
import { TenantContextGuard } from "./tenancy/tenant-context.guard";

@Global()
@Module({
  imports: [IdentityModule, OrganizationsModule, UsersModule],
  providers: [AuthenticatedRequestGuard, TenantContextGuard],
  exports: [AuthenticatedRequestGuard, TenantContextGuard],
})
export class SecurityModule {}
