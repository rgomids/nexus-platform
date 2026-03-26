import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  public getHealth(): { status: "ok" } {
    return { status: "ok" };
  }
}
