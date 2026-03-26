import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

let sdkInstance: NodeSDK | undefined;
let sdkInitialization: Promise<NodeSDK> | undefined;

export async function initializeTelemetry(): Promise<NodeSDK> {
  if (sdkInstance !== undefined) {
    return sdkInstance;
  }

  if (sdkInitialization !== undefined) {
    return sdkInitialization;
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? "development",
      [SEMRESATTRS_SERVICE_NAME]: "nexus-platform",
      [SEMRESATTRS_SERVICE_VERSION]: "0.1.0",
    }),
  });

  sdkInitialization = Promise.resolve(sdk.start())
    .then(() => {
      sdkInstance = sdk;

      return sdk;
    })
    .catch((error: unknown) => {
      sdkInitialization = undefined;
      throw error;
    });

  return sdkInitialization;
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdkInstance === undefined) {
    return;
  }

  await sdkInstance.shutdown();
  sdkInstance = undefined;
  sdkInitialization = undefined;
}
