import { Injectable } from "@nestjs/common";

const DEFAULT_DURATION_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

interface CounterSeries {
  readonly labels: Record<string, string>;
  value: number;
}

interface CounterMetric {
  readonly help: string;
  readonly name: string;
  readonly series: Map<string, CounterSeries>;
  readonly type: "counter";
}

interface HistogramSeries {
  readonly bucketCounts: number[];
  count: number;
  readonly labels: Record<string, string>;
  sum: number;
}

interface HistogramMetric {
  readonly buckets: number[];
  readonly help: string;
  readonly name: string;
  readonly series: Map<string, HistogramSeries>;
  readonly type: "histogram";
}

type Metric = CounterMetric | HistogramMetric;

@Injectable()
export class ApplicationMetricsService {
  private readonly metrics = new Map<string, Metric>();

  public recordHttpRequest(input: {
    readonly durationMs: number;
    readonly method: string;
    readonly route: string;
    readonly statusCode: number;
  }): void {
    const labels = {
      method: input.method,
      route: input.route,
      status_code: input.statusCode.toString(),
    };

    this.incrementCounter(
      "nexus_http_requests_total",
      "Total HTTP requests handled by the application.",
      labels,
    );
    this.observeHistogram(
      "nexus_http_request_duration_ms",
      "HTTP request duration in milliseconds.",
      input.durationMs,
      labels,
    );
  }

  public recordModuleFailure(input: {
    readonly errorCode: string;
    readonly module: string;
    readonly operation: string;
  }): void {
    this.incrementCounter(
      "nexus_module_failures_total",
      "Total failed operations grouped by module and operation.",
      {
        error_code: input.errorCode,
        module: input.module,
        operation: input.operation,
      },
    );
  }

  public recordLoginResult(result: "success" | "failure"): void {
    this.incrementCounter(
      "nexus_identity_logins_total",
      "Total login attempts grouped by result.",
      { result },
    );
  }

  public recordAuthorizationDecision(result: "allow" | "deny"): void {
    this.incrementCounter(
      "nexus_authorization_decisions_total",
      "Total authorization decisions grouped by result.",
      { result },
    );
  }

  public recordAuditOperation(input: {
    readonly durationMs: number;
    readonly operation: "append" | "query";
  }): void {
    this.incrementCounter(
      "nexus_audit_operations_total",
      "Total audit operations grouped by operation.",
      { operation: input.operation },
    );
    this.observeHistogram(
      "nexus_audit_operation_duration_ms",
      "Audit operation duration in milliseconds.",
      input.durationMs,
      { operation: input.operation },
    );
  }

  public renderPrometheusMetrics(): string {
    const lines: string[] = [];
    const metrics = [...this.metrics.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    for (const metric of metrics) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (metric.type === "counter") {
        for (const [seriesKey, series] of [...metric.series.entries()].sort()) {
          lines.push(
            `${metric.name}${formatLabels(series.labels)} ${series.value}`,
          );
          void seriesKey;
        }

        lines.push("");
        continue;
      }

      for (const [seriesKey, series] of [...metric.series.entries()].sort()) {
        let cumulativeCount = 0;

        metric.buckets.forEach((bucket, index) => {
          cumulativeCount += series.bucketCounts[index] ?? 0;
          lines.push(
            `${metric.name}_bucket${formatLabels({
              ...series.labels,
              le: bucket.toString(),
            })} ${cumulativeCount}`,
          );
        });
        lines.push(
          `${metric.name}_bucket${formatLabels({
            ...series.labels,
            le: "+Inf",
          })} ${series.count}`,
        );
        lines.push(
          `${metric.name}_sum${formatLabels(series.labels)} ${series.sum}`,
        );
        lines.push(
          `${metric.name}_count${formatLabels(series.labels)} ${series.count}`,
        );
        void seriesKey;
      }

      lines.push("");
    }

    return `${lines.join("\n").trim()}\n`;
  }

  private incrementCounter(
    name: string,
    help: string,
    labels: Record<string, string>,
    value = 1,
  ): void {
    const metric = this.getOrCreateCounter(name, help);
    const series = metric.series.get(buildSeriesKey(labels));

    if (series === undefined) {
      metric.series.set(buildSeriesKey(labels), {
        labels,
        value,
      });
      return;
    }

    series.value += value;
  }

  private observeHistogram(
    name: string,
    help: string,
    value: number,
    labels: Record<string, string>,
    buckets = DEFAULT_DURATION_BUCKETS,
  ): void {
    const metric = this.getOrCreateHistogram(name, help, buckets);
    const seriesKey = buildSeriesKey(labels);
    const series = metric.series.get(seriesKey) ?? {
      bucketCounts: buckets.map(() => 0),
      count: 0,
      labels,
      sum: 0,
    };

    const bucketIndex = buckets.findIndex((bucket) => value <= bucket);

    if (bucketIndex >= 0) {
      series.bucketCounts[bucketIndex] = (series.bucketCounts[bucketIndex] ?? 0) + 1;
    }

    series.count += 1;
    series.sum += value;
    metric.series.set(seriesKey, series);
  }

  private getOrCreateCounter(name: string, help: string): CounterMetric {
    const existingMetric = this.metrics.get(name);

    if (existingMetric !== undefined) {
      if (existingMetric.type !== "counter") {
        throw new Error(`Metric ${name} already exists with a different type`);
      }

      return existingMetric;
    }

    const metric: CounterMetric = {
      help,
      name,
      series: new Map<string, CounterSeries>(),
      type: "counter",
    };

    this.metrics.set(name, metric);

    return metric;
  }

  private getOrCreateHistogram(
    name: string,
    help: string,
    buckets: number[],
  ): HistogramMetric {
    const existingMetric = this.metrics.get(name);

    if (existingMetric !== undefined) {
      if (existingMetric.type !== "histogram") {
        throw new Error(`Metric ${name} already exists with a different type`);
      }

      return existingMetric;
    }

    const metric: HistogramMetric = {
      buckets,
      help,
      name,
      series: new Map<string, HistogramSeries>(),
      type: "histogram",
    };

    this.metrics.set(name, metric);

    return metric;
  }
}

function buildSeriesKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function formatLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );

  if (entries.length === 0) {
    return "";
  }

  return `{${entries
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",")}}`;
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}
