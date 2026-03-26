import {
  InvalidUserFullNameError,
  User,
} from "../../../../src/modules/users/domain/entities/user.entity";

describe("User", () => {
  it("creates an active user with a normalized full name", () => {
    const now = new Date("2026-03-25T12:00:00.000Z");

    const user = User.create({
      fullName: "  Jane Doe  ",
      id: "user-1",
      now,
    });

    expect(user).toMatchObject({
      fullName: "Jane Doe",
      id: "user-1",
      status: "active",
    });
  });

  it("rejects an invalid full name", () => {
    expect(() =>
      User.create({
        fullName: "  ",
        id: "user-1",
        now: new Date(),
      }),
    ).toThrow(InvalidUserFullNameError);
  });
});
