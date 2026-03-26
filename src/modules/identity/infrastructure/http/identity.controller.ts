import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { InvalidAccessTokenError } from "../../domain/identity.errors";
import { CreateUserAccountUseCase } from "../../application/use-cases/create-user-account.use-case";
import { InvalidateSessionUseCase } from "../../application/use-cases/invalidate-session.use-case";
import { LoginWithPasswordUseCase } from "../../application/use-cases/login-with-password.use-case";
import { CreateAccountRequestDto } from "./create-account.request";
import { LoginRequestDto } from "./login.request";

@Controller("identity")
export class IdentityController {
  public constructor(
    private readonly createUserAccountUseCase: CreateUserAccountUseCase,
    private readonly loginWithPasswordUseCase: LoginWithPasswordUseCase,
    private readonly invalidateSessionUseCase: InvalidateSessionUseCase,
  ) {}

  @Post("accounts")
  public createAccount(@Body() body: CreateAccountRequestDto) {
    return this.createUserAccountUseCase.execute(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  public login(@Body() body: LoginRequestDto) {
    return this.loginWithPasswordUseCase.execute(body);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(@Headers("authorization") authorization?: string): Promise<void> {
    const accessToken = this.readAccessToken(authorization);

    await this.invalidateSessionUseCase.execute(accessToken);
  }

  private readAccessToken(authorization?: string): string {
    if (authorization === undefined) {
      throw new InvalidAccessTokenError();
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || token === undefined || token.length === 0) {
      throw new InvalidAccessTokenError();
    }

    return token;
  }
}
