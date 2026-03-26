import type { MembershipStatus } from "../../domain/entities/membership.entity";

export const USERS_TENANCY_CONTRACT = Symbol("USERS_TENANCY_CONTRACT");

export interface CreateMembershipInput {
  readonly organizationId: string;
  readonly userId: string;
}

export interface MembershipSnapshot {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly status: MembershipStatus;
  readonly userId: string;
}

export interface UsersTenancyContract {
  countActiveMemberships(userId: string): Promise<number>;
  createMembership(input: CreateMembershipInput): Promise<MembershipSnapshot>;
  findActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<MembershipSnapshot | null>;
  listMembershipsByOrganization(organizationId: string): Promise<MembershipSnapshot[]>;
}
