import { Global, Module } from "@nestjs/common";

import { APP_CONFIG, type AppConfig } from "../config/app-config";
import { AppConfigModule } from "../config/app-config.module";
import { DATABASE_POOL } from "./database.constants";
import { createDatabasePool } from "./database.providers";
import { DatabaseConnectionService } from "./database.service";

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => createDatabasePool(config),
    },
    DatabaseConnectionService,
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
