import { ValidationError } from "../../../../shared/domain/nexus.errors";

export type OrganizationStatus = "active" | "inactive";

export class InvalidOrganizationNameError extends ValidationError {
  public constructor() {
    super(
      "Organization name must contain between 3 and 120 characters",
      "invalid_organization_name",
      "Organization name must contain between 3 and 120 characters",
    );
  }
}

export interface CreateOrganizationProps {
  readonly id: string;
  readonly name: string;
  readonly now: Date;
}

export class Organization {
  public static create(props: CreateOrganizationProps): Organization {
    const normalizedName = props.name.trim();

    if (normalizedName.length < 3 || normalizedName.length > 120) {
      throw new InvalidOrganizationNameError();
    }

    return new Organization(props.id, normalizedName, "active", props.now, props.now);
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly id: string;
    readonly name: string;
    readonly status: OrganizationStatus;
    readonly updatedAt: Date;
  }): Organization {
    return new Organization(props.id, props.name, props.status, props.createdAt, props.updatedAt);
  }

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly status: OrganizationStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public deactivate(now: Date): Organization {
    if (this.status === "inactive") {
      return this;
    }

    return new Organization(this.id, this.name, "inactive", this.createdAt, now);
  }
}
