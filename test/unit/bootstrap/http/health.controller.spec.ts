import { HealthController } from "../../../../src/bootstrap/http/health.controller";

describe("HealthController", () => {
  it("returns the platform health status", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({ status: "ok" });
  });
});
