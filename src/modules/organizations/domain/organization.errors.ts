import {
  NotFoundError,
  ValidationError,
} from "../../../shared/domain/nexus.errors";

export class OrganizationNotFoundError extends NotFoundError {
  public constructor() {
    super(
      "Organization was not found",
      "organization_not_found",
      "Organization not found",
    );
  }
}

export class OrganizationInactiveError extends ValidationError {
  public constructor() {
    super(
      "Organization is inactive",
      "organization_inactive",
      "Organization is inactive",
    );
  }
}
