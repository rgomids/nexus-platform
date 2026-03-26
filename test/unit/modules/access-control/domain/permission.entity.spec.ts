import {
  InvalidPermissionCodeError,
} from "../../../../../src/modules/access-control/domain/access-control.errors";
import { Permission } from "../../../../../src/modules/access-control/domain/entities/permission.entity";

describe("Permission", () => {
  it("creates a permission with a normalized code", () => {
    const permission = Permission.create({
      code: "  user:create  ",
      id: "permission-1",
      now: new Date(),
      organizationId: "organization-1",
    });

    expect(permission.code).toBe("user:create");
    expect(permission.organizationId).toBe("organization-1");
  });

  it("rejects permission codes outside resource:action format", () => {
    expect(() =>
      Permission.create({
        code: "users.create",
        id: "permission-1",
        now: new Date(),
        organizationId: "organization-1",
      }),
    ).toThrow(InvalidPermissionCodeError);
  });
});
