import { ValidationError } from "../../../../shared/domain/nexus.errors";

export type UserStatus = "active" | "inactive";

export class InvalidUserFullNameError extends ValidationError {
  public constructor() {
    super("User full name must contain between 3 and 120 characters", "invalid_user_full_name", "Full name must contain between 3 and 120 characters");
  }
}

export interface CreateUserProps {
  readonly id: string;
  readonly fullName: string;
  readonly now: Date;
}

export class User {
  public static create(props: CreateUserProps): User {
    const normalizedFullName = props.fullName.trim();

    if (normalizedFullName.length < 3 || normalizedFullName.length > 120) {
      throw new InvalidUserFullNameError();
    }

    return new User(props.id, normalizedFullName, "active", props.now, props.now);
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly fullName: string;
    readonly id: string;
    readonly status: UserStatus;
    readonly updatedAt: Date;
  }): User {
    return new User(props.id, props.fullName, props.status, props.createdAt, props.updatedAt);
  }

  private constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
