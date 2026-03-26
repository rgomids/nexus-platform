import { Inject, Injectable } from "@nestjs/common";

import { User } from "../../domain/entities/user.entity";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import type { CreateUserInput, UserSnapshot } from "../contracts/users-identity.contract";

@Injectable()
export class CreateUserUseCase {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  public async execute(input: CreateUserInput): Promise<UserSnapshot> {
    const user = User.create({
      fullName: input.fullName,
      id: input.userId,
      now: new Date(),
    });

    await this.userRepository.save(user);

    return {
      fullName: user.fullName,
      status: user.status,
      userId: user.id,
    };
  }
}
