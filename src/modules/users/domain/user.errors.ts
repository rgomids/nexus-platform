import {
  ConflictError,
  NotFoundError,
} from "../../../shared/domain/nexus.errors";

export class UserNotFoundError extends NotFoundError {
  public constructor() {
    super("User was not found", "user_not_found", "User not found");
  }
}

export class MembershipAlreadyExistsError extends ConflictError {
  public constructor() {
    super(
      "Membership already exists",
      "membership_already_exists",
      "Membership already exists",
    );
  }
}

export class MembershipNotFoundError extends NotFoundError {
  public constructor() {
    super(
      "Membership was not found",
      "membership_not_found",
      "Membership not found",
    );
  }
}
