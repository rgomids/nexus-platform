import type { OrganizationStatus } from "../../domain/entities/organization.entity";

export const ORGANIZATIONS_TENANCY_CONTRACT = Symbol("ORGANIZATIONS_TENANCY_CONTRACT");

export interface OrganizationSnapshot {
  readonly name: string;
  readonly organizationId: string;
  readonly status: OrganizationStatus;
}

export interface OrganizationsTenancyContract {
  getOrganizationById(organizationId: string): Promise<OrganizationSnapshot | null>;
}
