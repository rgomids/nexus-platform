import { Global, Module } from "@nestjs/common";

import { RequestCorrelationContext } from "../request-correlation/request-correlation.context";
import { InternalEventBus } from "./internal-event-bus";

@Global()
@Module({
  providers: [InternalEventBus, RequestCorrelationContext],
  exports: [InternalEventBus, RequestCorrelationContext],
})
export class SharedEventsModule {}
