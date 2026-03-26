import { Inject, Injectable } from "@nestjs/common";

import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import type { UserSnapshot } from "../contracts/users-identity.contract";

@Injectable()
export class GetUserByIdUseCase {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  public async execute(userId: string): Promise<UserSnapshot | null> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      return null;
    }

    return {
      fullName: user.fullName,
      status: user.status,
      userId: user.id,
    };
  }
}
