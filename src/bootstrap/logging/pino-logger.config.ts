import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import pino from "pino";
import type { Options } from "pino-http";

import type { AppConfig } from "../config/app-config";
import type { RequestWithSecurityContext } from "../../shared/auth/request-context.types";

export function buildPinoHttpConfiguration(
  config: AppConfig,
): Options<IncomingMessage, ServerResponse<IncomingMessage>> {
  return {
    autoLogging: true,
    base: null,
    customProps: (request) => buildHttpLogProperties(request as RequestWithSecurityContext),
    formatters: {
      level: (label) => ({ level: label }),
      log: (object) => renameStructuredLogFields(object),
    },
    genReqId: (request) => {
      const correlationHeader = request.headers["x-correlation-id"];

      if (typeof correlationHeader === "string" && correlationHeader.length > 0) {
        return correlationHeader;
      }

      if (Array.isArray(correlationHeader) && correlationHeader[0] !== undefined) {
        return correlationHeader[0];
      }

      if (typeof request.id === "string" || typeof request.id === "number") {
        return request.id.toString();
      }

      return randomUUID();
    },
    level: config.app.nodeEnv === "development" ? "debug" : "info",
    messageKey: "message",
    serializers: {
      err: (error) => sanitizeError(error),
      req: (request: IncomingMessage) => sanitizeRequest(request),
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  };
}

function buildHttpLogProperties(
  request: RequestWithSecurityContext & { id?: unknown },
): Record<string, string> {
  return {
    correlationId:
      typeof request.id === "string" || typeof request.id === "number"
        ? request.id.toString()
        : "unknown",
    module: "http",
    ...(request.tenantContext === undefined
      ? {}
      : {
          tenantId: request.tenantContext.organizationId,
        }),
    ...(request.authenticatedPrincipal === undefined
      ? {}
      : {
          userId: request.authenticatedPrincipal.userId,
        }),
  };
}

function renameStructuredLogFields(
  object: Record<string, unknown>,
): Record<string, unknown> {
  const renamedObject = { ...object };

  moveStructuredLogField(renamedObject, "correlationId", "correlation_id");
  moveStructuredLogField(renamedObject, "organizationId", "tenant_id");
  moveStructuredLogField(renamedObject, "tenantId", "tenant_id");
  moveStructuredLogField(renamedObject, "userId", "user_id");
  moveStructuredLogField(renamedObject, "targetUserId", "target_user_id");
  moveStructuredLogField(renamedObject, "accountId", "account_id");
  moveStructuredLogField(renamedObject, "sessionId", "session_id");
  moveStructuredLogField(renamedObject, "permissionCode", "permission_code");
  moveStructuredLogField(renamedObject, "permissionId", "permission_id");
  moveStructuredLogField(renamedObject, "roleId", "role_id");
  moveStructuredLogField(renamedObject, "membershipId", "membership_id");
  moveStructuredLogField(renamedObject, "statusCode", "status_code");
  moveStructuredLogField(renamedObject, "responseTime", "response_time");
  moveStructuredLogField(renamedObject, "errorCode", "error_code");
  moveStructuredLogField(renamedObject, "failedAuditEvent", "failed_audit_event");

  return renamedObject;
}

function moveStructuredLogField(
  object: Record<string, unknown>,
  currentKey: string,
  targetKey: string,
): void {
  if (!(currentKey in object) || currentKey === targetKey) {
    return;
  }

  if (!(targetKey in object)) {
    object[targetKey] = object[currentKey];
  }

  delete object[currentKey];
}

function sanitizeRequest(request: IncomingMessage): Record<string, unknown> {
  const serializedRequest = pino.stdSerializers.req(request);

  if (serializedRequest === undefined || typeof serializedRequest !== "object") {
    return {};
  }

  const sanitizedRequest = {
    ...((serializedRequest as unknown) as Record<string, unknown>),
  };
  const headers = sanitizedRequest.headers;

  if (headers !== undefined && typeof headers === "object" && headers !== null) {
    const sanitizedHeaders = { ...(headers as Record<string, unknown>) };

    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;
    delete sanitizedHeaders["set-cookie"];
    sanitizedRequest.headers = sanitizedHeaders;
  }

  return sanitizedRequest;
}

function sanitizeError(error: unknown): Record<string, unknown> {
  const serializedError =
    error instanceof Error ? pino.stdSerializers.err(error) : undefined;

  if (serializedError === undefined || typeof serializedError !== "object") {
    return {};
  }

  const sanitizedError = {
    ...(serializedError as Record<string, unknown>),
  };

  delete sanitizedError.stack;

  return sanitizedError;
}
