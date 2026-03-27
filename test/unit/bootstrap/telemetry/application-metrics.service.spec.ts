import { ApplicationMetricsService } from "../../../../src/bootstrap/telemetry/application-metrics.service";

describe("ApplicationMetricsService", () => {
  it("renders Prometheus counters and histograms for the recorded operations", () => {
    const service = new ApplicationMetricsService();

    service.recordHttpRequest({
      durationMs: 12,
      method: "GET",
      route: "/health",
      statusCode: 200,
    });
    service.recordLoginResult("success");
    service.recordAuthorizationDecision("deny");
    service.recordAuditOperation({
      durationMs: 6,
      operation: "append",
    });

    const output = service.renderPrometheusMetrics();

    expect(output).toContain("nexus_http_requests_total");
    expect(output).toContain('method="GET"');
    expect(output).toContain("nexus_http_request_duration_ms_bucket");
    expect(output).toContain("nexus_identity_logins_total");
    expect(output).toContain('result="success"');
    expect(output).toContain("nexus_authorization_decisions_total");
    expect(output).toContain('result="deny"');
    expect(output).toContain("nexus_audit_operations_total");
    expect(output).toContain('operation="append"');
  });
});
