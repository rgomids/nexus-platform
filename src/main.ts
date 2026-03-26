import { PinoLogger } from "nestjs-pino";

import { createApplication, disposeApplication } from "./bootstrap/application.factory";
import { ApplicationConfigService } from "./bootstrap/config/application-config.service";
import { initializeTelemetry } from "./bootstrap/telemetry/telemetry.sdk";

async function bootstrap(): Promise<void> {
  await initializeTelemetry();

  const application = await createApplication();
  const configuration = application.get(ApplicationConfigService);
  const logger = application.get(PinoLogger);

  registerSignalHandlers(application, logger);

  await application.listen(configuration.appPort);
  logger.info({ event: "build", port: configuration.appPort }, "HTTP server listening");
}

function registerSignalHandlers(
  application: Awaited<ReturnType<typeof createApplication>>,
  logger: PinoLogger,
): void {
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ event: "start", signal }, "Shutdown signal received");
    await disposeApplication(application);
    logger.info({ event: "success", signal }, "Application shutdown completed");
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

if (require.main === module) {
  void bootstrap();
}
