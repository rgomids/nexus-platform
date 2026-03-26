import { SetMetadata } from "@nestjs/common";

export const REQUIRED_PERMISSION_METADATA_KEY = "required_permission";

export const RequirePermission = (permissionCode: string) =>
  SetMetadata(REQUIRED_PERMISSION_METADATA_KEY, permissionCode);
