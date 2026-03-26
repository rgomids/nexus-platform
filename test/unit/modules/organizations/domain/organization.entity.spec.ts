import {
  InvalidOrganizationNameError,
  Organization,
} from "../../../../../src/modules/organizations/domain/entities/organization.entity";

describe("Organization", () => {
  it("creates an active organization with a normalized name", () => {
    const now = new Date("2026-03-26T12:00:00.000Z");

    const organization = Organization.create({
      id: "organization-1",
      name: "  Acme Corp  ",
      now,
    });

    expect(organization).toMatchObject({
      id: "organization-1",
      name: "Acme Corp",
      status: "active",
    });
  });

  it("deactivates an active organization", () => {
    const organization = Organization.create({
      id: "organization-1",
      name: "Acme Corp",
      now: new Date("2026-03-26T12:00:00.000Z"),
    });

    const deactivated = organization.deactivate(new Date("2026-03-26T13:00:00.000Z"));

    expect(deactivated.status).toBe("inactive");
    expect(deactivated.updatedAt.toISOString()).toBe("2026-03-26T13:00:00.000Z");
  });

  it("rejects an invalid organization name", () => {
    expect(() =>
      Organization.create({
        id: "organization-1",
        name: "  ",
        now: new Date(),
      }),
    ).toThrow(InvalidOrganizationNameError);
  });
});
