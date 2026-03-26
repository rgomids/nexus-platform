import type { UserStatus } from "../../domain/entities/user.entity";

export const USERS_IDENTITY_CONTRACT = Symbol("USERS_IDENTITY_CONTRACT");

export interface CreateUserInput {
  readonly fullName: string;
  readonly userId: string;
}

export interface UserSnapshot {
  readonly fullName: string;
  readonly status: UserStatus;
  readonly userId: string;
}

export interface UsersIdentityContract {
  createUser(input: CreateUserInput): Promise<UserSnapshot>;
  getUserById(userId: string): Promise<UserSnapshot | null>;
}
