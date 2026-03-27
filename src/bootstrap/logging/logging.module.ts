import { Global, Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { APP_CONFIG, type AppConfig } from "../config/app-config";
import { AppConfigModule } from "../config/app-config.module";
import { buildPinoHttpConfiguration } from "./pino-logger.config";

@Global()
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: buildPinoHttpConfiguration(config),
        renameContext: "module",
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
