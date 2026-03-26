import { AsyncLocalStorage } from "node:async_hooks";

import { Injectable } from "@nestjs/common";

@Injectable()
export class RequestCorrelationContext {
  private readonly storage = new AsyncLocalStorage<string>();

  public getCorrelationId(): string | null {
    return this.storage.getStore() ?? null;
  }

  public getCorrelationIdOrDefault(defaultValue = "unknown"): string {
    return this.getCorrelationId() ?? defaultValue;
  }

  public run<T>(correlationId: string, operation: () => T): T {
    return this.storage.run(correlationId, operation);
  }
}
