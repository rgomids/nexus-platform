import type { Membership } from "../entities/membership.entity";

export const MEMBERSHIP_REPOSITORY = Symbol("MEMBERSHIP_REPOSITORY");

export interface MembershipRepository {
  countActiveByUserId(userId: string): Promise<number>;
  findActiveByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
  findByOrganizationId(organizationId: string): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
}
