import { Type } from "class-transformer";
import { IsISO8601, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

import { AUDIT_LOG_ACTIONS } from "../../domain/entities/audit-log-entry.entity";

export class ListAuditLogsRequestDto {
  @IsUUID()
  public readonly tenantId!: string;

  @IsOptional()
  @IsUUID()
  public readonly userId?: string;

  @IsOptional()
  @IsIn(AUDIT_LOG_ACTIONS)
  public readonly action?: (typeof AUDIT_LOG_ACTIONS)[number];

  @IsOptional()
  @IsISO8601()
  public readonly from?: string;

  @IsOptional()
  @IsISO8601()
  public readonly to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public readonly limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  public readonly offset?: number;
}
