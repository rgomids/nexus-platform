import { createValidationExceptionFactory } from "../../../../src/bootstrap/errors/validation-exception.factory";

describe("createValidationExceptionFactory", () => {
  it("uses the first direct validation constraint message", () => {
    const exceptionFactory = createValidationExceptionFactory();

    const error = exceptionFactory([
      {
        constraints: {
          isEmail: "email must be an email",
        },
        property: "email",
      },
    ] as never);

    expect(error.code).toBe("invalid_request");
    expect(error.publicMessage).toBe("email must be an email");
  });

  it("falls back to nested validation messages", () => {
    const exceptionFactory = createValidationExceptionFactory();

    const error = exceptionFactory([
      {
        children: [
          {
            constraints: {
              minLength: "password must be longer than or equal to 8 characters",
            },
            property: "password",
          },
        ],
        property: "body",
      },
    ] as never);

    expect(error.publicMessage).toBe(
      "password must be longer than or equal to 8 characters",
    );
  });
});
