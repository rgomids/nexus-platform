import { Global, Module } from "@nestjs/common";

import { APP_CONFIG, loadAppConfig, loadEnvironmentVariables } from "./app-config";
import { ApplicationConfigService } from "./application-config.service";

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => {
        loadEnvironmentVariables();

        return loadAppConfig();
      },
    },
    ApplicationConfigService,
  ],
  exports: [APP_CONFIG, ApplicationConfigService],
})
export class AppConfigModule {}
