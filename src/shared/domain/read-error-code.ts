import type { NexusError } from "./nexus.errors";

export function readErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as NexusError).code === "string"
  ) {
    return (error as NexusError).code;
  }

  return "unknown_error";
}
