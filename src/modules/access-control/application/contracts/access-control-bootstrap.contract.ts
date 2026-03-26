export const ACCESS_CONTROL_BOOTSTRAP_CONTRACT = Symbol(
  "ACCESS_CONTROL_BOOTSTRAP_CONTRACT",
);

export interface BootstrapTenantAccessControlInput {
  readonly createdByUserId: string;
  readonly organizationId: string;
}

export interface AccessControlBootstrapContract {
  bootstrapTenantAccessControl(
    input: BootstrapTenantAccessControlInput,
  ): Promise<void>;
}
