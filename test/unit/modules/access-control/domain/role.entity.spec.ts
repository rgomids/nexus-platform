import {
  InvalidRoleNameError,
} from "../../../../../src/modules/access-control/domain/access-control.errors";
import { Role } from "../../../../../src/modules/access-control/domain/entities/role.entity";

describe("Role", () => {
  it("creates a role with a normalized name", () => {
    const role = Role.create({
      id: "role-1",
      name: "  Organization Admin  ",
      now: new Date(),
      organizationId: "organization-1",
    });

    expect(role.name).toBe("Organization Admin");
    expect(role.organizationId).toBe("organization-1");
  });

  it("rejects names shorter than 3 characters", () => {
    expect(() =>
      Role.create({
        id: "role-1",
        name: "ab",
        now: new Date(),
        organizationId: "organization-1",
      }),
    ).toThrow(InvalidRoleNameError);
  });
});
