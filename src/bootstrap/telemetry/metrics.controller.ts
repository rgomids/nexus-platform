import { Controller, Get, Header } from "@nestjs/common";

import { ApplicationMetricsService } from "./application-metrics.service";

@Controller()
export class MetricsController {
  public constructor(private readonly applicationMetricsService: ApplicationMetricsService) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  public getMetrics(): string {
    return this.applicationMetricsService.renderPrometheusMetrics();
  }
}
