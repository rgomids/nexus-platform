import type { ValidationError as ClassValidationError } from "class-validator";

import { InvalidRequestError } from "../../shared/domain/nexus.errors";

export function createValidationExceptionFactory() {
  return (errors: ClassValidationError[]): InvalidRequestError =>
    new InvalidRequestError(readValidationMessage(errors));
}

function readValidationMessage(errors: ClassValidationError[]): string {
  for (const error of errors) {
    const directMessage = readDirectConstraintMessage(error);

    if (directMessage !== undefined) {
      return directMessage;
    }

    if (error.children !== undefined && error.children.length > 0) {
      const childMessage = readValidationMessage(error.children);

      if (childMessage.length > 0) {
        return childMessage;
      }
    }
  }

  return "Request validation failed";
}

function readDirectConstraintMessage(
  error: ClassValidationError,
): string | undefined {
  if (error.constraints === undefined) {
    return undefined;
  }

  return Object.values(error.constraints).find(
    (message) => typeof message === "string" && message.length > 0,
  );
}
