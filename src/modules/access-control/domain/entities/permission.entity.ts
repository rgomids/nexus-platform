import { InvalidPermissionCodeError } from "../access-control.errors";

export interface CreatePermissionProps {
  readonly code: string;
  readonly id: string;
  readonly now: Date;
  readonly organizationId: string;
}

export class Permission {
  public static create(props: CreatePermissionProps): Permission {
    const normalizedCode = props.code.trim();

    if (!/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(normalizedCode)) {
      throw new InvalidPermissionCodeError();
    }

    return new Permission(
      props.id,
      props.organizationId,
      normalizedCode,
      props.now,
      props.now,
    );
  }

  public static restore(props: {
    readonly code: string;
    readonly createdAt: Date;
    readonly id: string;
    readonly organizationId: string;
    readonly updatedAt: Date;
  }): Permission {
    return new Permission(
      props.id,
      props.organizationId,
      props.code,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly code: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
