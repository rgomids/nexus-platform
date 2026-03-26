import type { Organization } from "../entities/organization.entity";

export const ORGANIZATION_REPOSITORY = Symbol("ORGANIZATION_REPOSITORY");

export interface OrganizationRepository {
  findById(organizationId: string): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
  update(organization: Organization): Promise<void>;
}
