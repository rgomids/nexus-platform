import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/domain/nexus.errors";

export class InvalidRoleNameError extends ValidationError {
  public constructor() {
    super(
      "Role name must contain between 3 and 120 characters",
      "invalid_role_name",
      "Role name must contain between 3 and 120 characters",
    );
  }
}

export class InvalidPermissionCodeError extends ValidationError {
  public constructor() {
    super(
      "Permission code must follow the resource:action format",
      "invalid_permission_code",
      "Permission code must follow the resource:action format",
    );
  }
}

export class RoleAlreadyExistsError extends ConflictError {
  public constructor() {
    super("Role already exists", "role_already_exists", "Role already exists");
  }
}

export class RolePermissionAlreadyExistsError extends ConflictError {
  public constructor() {
    super(
      "Permission has already been granted to the role",
      "role_permission_already_exists",
      "Permission already granted to role",
    );
  }
}

export class UserRoleAssignmentAlreadyExistsError extends ConflictError {
  public constructor() {
    super(
      "Role has already been assigned to the user",
      "user_role_assignment_already_exists",
      "Role already assigned to user",
    );
  }
}

export class RoleNotFoundError extends NotFoundError {
  public constructor() {
    super("Role was not found", "role_not_found", "Role not found");
  }
}

export class PermissionNotFoundError extends NotFoundError {
  public constructor() {
    super("Permission was not found", "permission_not_found", "Permission not found");
  }
}

export class PermissionDeniedError extends AuthorizationError {
  public constructor() {
    super("Permission denied", "permission_denied", "Permission denied");
  }
}
