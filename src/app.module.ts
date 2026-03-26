import { Module } from "@nestjs/common";

import { AppConfigModule } from "./bootstrap/config/app-config.module";
import { HealthModule } from "./bootstrap/http/health.module";
import { LoggingModule } from "./bootstrap/logging/logging.module";
import { DatabaseModule } from "./bootstrap/persistence/database.module";
import { AccessControlModule } from "./modules/access-control/access-control.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    HealthModule,
    IdentityModule,
    OrganizationsModule,
    UsersModule,
    AccessControlModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
