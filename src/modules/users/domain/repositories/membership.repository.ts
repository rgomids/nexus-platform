import type { Membership } from "../entities/membership.entity";

export const MEMBERSHIP_REPOSITORY = Symbol("MEMBERSHIP_REPOSITORY");

export interface ListMembershipsByOrganizationFilters {
  readonly limit: number;
  readonly offset: number;
  readonly organizationId: string;
}

export interface MembershipRepository {
  countActiveByUserId(userId: string): Promise<number>;
  findActiveByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
  findByOrganizationId(
    filters: ListMembershipsByOrganizationFilters,
  ): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
}
