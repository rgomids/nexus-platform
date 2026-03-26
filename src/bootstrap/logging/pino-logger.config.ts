import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { Options } from "pino-http";

import type { AppConfig } from "../config/app-config";

export function buildPinoHttpConfiguration(
  config: AppConfig,
): Options<IncomingMessage, ServerResponse<IncomingMessage>> {
  return {
    autoLogging: true,
    base: null,
    customProps: (request) => ({
      correlationId:
        typeof request.id === "string" || typeof request.id === "number"
          ? request.id.toString()
          : "unknown",
    }),
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
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  };
}
