import { Injectable } from "@nestjs/common";
import {
  SpanKind,
  SpanStatusCode,
  context,
  trace,
  type Attributes,
  type Span,
} from "@opentelemetry/api";

@Injectable()
export class ApplicationTelemetryService {
  private readonly tracer = trace.getTracer("nexus-platform");

  public async runInSpan<TResult>(
    name: string,
    attributes: Attributes,
    operation: () => Promise<TResult> | TResult,
  ): Promise<TResult> {
    return await this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await operation();

        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        span.recordException(normalizeException(error));
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unexpected error",
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  public startHttpServerSpan(
    name: string,
    attributes: Attributes,
  ): Span {
    return this.tracer.startSpan(name, {
      attributes,
      kind: SpanKind.SERVER,
    });
  }

  public bindSpan<T>(span: Span, operation: () => T): T {
    return context.with(trace.setSpan(context.active(), span), operation);
  }

  public endHttpServerSpan(
    span: Span,
    attributes: Attributes,
    statusCode: number,
  ): void {
    span.setAttributes(attributes);
    span.setStatus({
      code: statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    });
    span.end();
  }
}

function normalizeException(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unexpected error");
}
