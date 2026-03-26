export abstract class NexusError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly publicMessage: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export abstract class ValidationError extends NexusError {}

export abstract class ConflictError extends NexusError {}

export abstract class AuthenticationError extends NexusError {}

export abstract class AuthorizationError extends NexusError {}

export abstract class NotFoundError extends NexusError {}
