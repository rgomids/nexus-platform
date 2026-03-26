import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from "../../../shared/domain/nexus.errors";

export class InvalidEmailError extends ValidationError {
  public constructor() {
    super("Email address is invalid", "invalid_email", "Email address is invalid");
  }
}

export class WeakPasswordError extends ValidationError {
  public constructor() {
    super(
      "Password must have at least 8 characters, one letter and one number",
      "weak_password",
      "Password must have at least 8 characters, one letter and one number",
    );
  }
}

export class DuplicateAccountEmailError extends ConflictError {
  public constructor() {
    super(
      "Account email is already in use",
      "duplicate_account_email",
      "Account email already exists",
    );
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  public constructor() {
    super("Authentication failed", "invalid_credentials", "Invalid credentials");
  }
}

export class InvalidAccessTokenError extends AuthenticationError {
  public constructor() {
    super("Access token is invalid", "invalid_access_token", "Unauthorized");
  }
}

export class SessionAlreadyInvalidatedError extends AuthenticationError {
  public constructor() {
    super("Session has already been invalidated", "session_invalidated", "Unauthorized");
  }
}
