import { Global, Module } from "@nestjs/common";

import { ApplicationMetricsService } from "./application-metrics.service";
import { ApplicationTelemetryService } from "./application-telemetry.service";
import { MetricsController } from "./metrics.controller";

@Global()
@Module({
  controllers: [MetricsController],
  providers: [ApplicationTelemetryService, ApplicationMetricsService],
  exports: [ApplicationTelemetryService, ApplicationMetricsService],
})
export class TelemetryModule {}
