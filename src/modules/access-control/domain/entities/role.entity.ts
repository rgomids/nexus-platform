import { InvalidRoleNameError } from "../access-control.errors";

export interface CreateRoleProps {
  readonly id: string;
  readonly name: string;
  readonly now: Date;
  readonly organizationId: string;
}

export class Role {
  public static create(props: CreateRoleProps): Role {
    const normalizedName = props.name.trim();

    if (normalizedName.length < 3 || normalizedName.length > 120) {
      throw new InvalidRoleNameError();
    }

    return new Role(
      props.id,
      props.organizationId,
      normalizedName,
      props.now,
      props.now,
    );
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly id: string;
    readonly name: string;
    readonly organizationId: string;
    readonly updatedAt: Date;
  }): Role {
    return new Role(
      props.id,
      props.organizationId,
      props.name,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
