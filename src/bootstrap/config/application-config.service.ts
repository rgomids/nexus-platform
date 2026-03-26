import { Inject, Injectable } from "@nestjs/common";

import { APP_CONFIG, type AppConfig } from "./app-config";

@Injectable()
export class ApplicationConfigService {
  public constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  public get appPort(): number {
    return this.config.app.port;
  }

  public get auth(): AppConfig["auth"] {
    return this.config.auth;
  }

  public get nodeEnv(): AppConfig["app"]["nodeEnv"] {
    return this.config.app.nodeEnv;
  }

  public get database(): AppConfig["database"] {
    return this.config.database;
  }
}
