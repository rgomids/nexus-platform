import { forwardRef, Module } from "@nestjs/common";

import { IdentityModule } from "../identity/identity.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import {
  ACCESS_CONTROL_BOOTSTRAP_CONTRACT,
  type AccessControlBootstrapContract,
} from "./application/contracts/access-control-bootstrap.contract";
import { AssignRoleToUserUseCase } from "./application/use-cases/assign-role-to-user.use-case";
import { AuthorizeActionUseCase } from "./application/use-cases/authorize-action.use-case";
import { BootstrapTenantAccessControlUseCase } from "./application/use-cases/bootstrap-tenant-access-control.use-case";
import { CreateRoleUseCase } from "./application/use-cases/create-role.use-case";
import { GrantPermissionToRoleUseCase } from "./application/use-cases/grant-permission-to-role.use-case";
import { ListPermissionsUseCase } from "./application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "./application/use-cases/list-roles.use-case";
import {
  PERMISSION_REPOSITORY,
} from "./domain/repositories/permission.repository";
import {
  ROLE_PERMISSION_REPOSITORY,
} from "./domain/repositories/role-permission.repository";
import {
  ROLE_REPOSITORY,
} from "./domain/repositories/role.repository";
import {
  USER_ROLE_ASSIGNMENT_REPOSITORY,
} from "./domain/repositories/user-role-assignment.repository";
import { AccessControlController } from "./infrastructure/http/access-control.controller";
import { PgPermissionRepository } from "./infrastructure/persistence/pg-permission.repository";
import { PgRolePermissionRepository } from "./infrastructure/persistence/pg-role-permission.repository";
import { PgRoleRepository } from "./infrastructure/persistence/pg-role.repository";
import { PgUserRoleAssignmentRepository } from "./infrastructure/persistence/pg-user-role-assignment.repository";
import { AuthenticatedRequestGuard } from "../../shared/auth/authenticated-request.guard";
import { AuthorizationGuard } from "../../shared/auth/authorization.guard";
import { ActiveTenantGuard } from "../../shared/tenancy/active-tenant.guard";
import { TenantContextResolverService } from "../../shared/tenancy/tenant-context-resolver.service";

@Module({
  controllers: [AccessControlController],
  imports: [
    UsersModule,
    forwardRef(() => IdentityModule),
    forwardRef(() => OrganizationsModule),
  ],
  providers: [
    BootstrapTenantAccessControlUseCase,
    CreateRoleUseCase,
    ListRolesUseCase,
    ListPermissionsUseCase,
    GrantPermissionToRoleUseCase,
    AssignRoleToUserUseCase,
    AuthorizeActionUseCase,
    TenantContextResolverService,
    AuthenticatedRequestGuard,
    ActiveTenantGuard,
    AuthorizationGuard,
    PgRoleRepository,
    PgPermissionRepository,
    PgRolePermissionRepository,
    PgUserRoleAssignmentRepository,
    {
      provide: ROLE_REPOSITORY,
      useExisting: PgRoleRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useExisting: PgPermissionRepository,
    },
    {
      provide: ROLE_PERMISSION_REPOSITORY,
      useExisting: PgRolePermissionRepository,
    },
    {
      provide: USER_ROLE_ASSIGNMENT_REPOSITORY,
      useExisting: PgUserRoleAssignmentRepository,
    },
    {
      provide: ACCESS_CONTROL_BOOTSTRAP_CONTRACT,
      inject: [BootstrapTenantAccessControlUseCase],
      useFactory: (
        bootstrapTenantAccessControlUseCase: BootstrapTenantAccessControlUseCase,
      ): AccessControlBootstrapContract => ({
        bootstrapTenantAccessControl: (input) =>
          bootstrapTenantAccessControlUseCase.execute(input),
      }),
    },
  ],
  exports: [ACCESS_CONTROL_BOOTSTRAP_CONTRACT, AuthorizeActionUseCase],
})
export class AccessControlModule {}
