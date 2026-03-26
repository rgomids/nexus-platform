import { Membership } from "../../../../../src/modules/users/domain/entities/membership.entity";

describe("Membership", () => {
  it("creates an active membership", () => {
    const now = new Date("2026-03-26T12:00:00.000Z");

    const membership = Membership.create({
      id: "membership-1",
      now,
      organizationId: "organization-1",
      userId: "user-1",
    });

    expect(membership).toMatchObject({
      id: "membership-1",
      organizationId: "organization-1",
      status: "active",
      userId: "user-1",
    });
  });

  it("deactivates a membership", () => {
    const membership = Membership.create({
      id: "membership-1",
      now: new Date("2026-03-26T12:00:00.000Z"),
      organizationId: "organization-1",
      userId: "user-1",
    });

    const inactiveMembership = membership.deactivate(new Date("2026-03-26T13:00:00.000Z"));

    expect(inactiveMembership.status).toBe("inactive");
    expect(inactiveMembership.updatedAt.toISOString()).toBe("2026-03-26T13:00:00.000Z");
  });
});
