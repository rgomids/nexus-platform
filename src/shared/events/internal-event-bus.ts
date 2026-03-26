import { Injectable } from "@nestjs/common";

import type { InternalEvent, InternalEventType } from "./internal-events";

export type InternalEventHandler<TEvent extends InternalEvent = InternalEvent> = (
  event: TEvent,
) => Promise<void> | void;

@Injectable()
export class InternalEventBus {
  private readonly subscribers = new Map<InternalEventType, InternalEventHandler[]>();

  public subscribe<TType extends InternalEventType>(
    type: TType,
    handler: InternalEventHandler<Extract<InternalEvent, { type: TType }>>,
  ): () => void {
    const handlers = this.subscribers.get(type) ?? [];

    handlers.push(handler as InternalEventHandler);
    this.subscribers.set(type, handlers);

    return () => {
      const activeHandlers = this.subscribers.get(type) ?? [];
      const nextHandlers = activeHandlers.filter(
        (candidate) => candidate !== (handler as InternalEventHandler),
      );

      if (nextHandlers.length === 0) {
        this.subscribers.delete(type);
        return;
      }

      this.subscribers.set(type, nextHandlers);
    };
  }

  public async publish(event: InternalEvent): Promise<void> {
    const handlers = this.subscribers.get(event.type) ?? [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}
