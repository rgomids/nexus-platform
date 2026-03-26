import type { DatabaseExecutor } from "../../src/bootstrap/persistence/database.executor";
import type { InternalEventBus } from "../../src/shared/events/internal-event-bus";

export function createDatabaseExecutorMock(): DatabaseExecutor {
  return {
    withTransaction: jest.fn(async (operation: () => Promise<unknown>) => operation()),
  } as unknown as DatabaseExecutor;
}

export function createInternalEventBusMock(): InternalEventBus {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
  } as unknown as InternalEventBus;
}
