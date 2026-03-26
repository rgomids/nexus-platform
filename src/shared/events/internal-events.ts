export interface UserCreatedInternalEvent {
  readonly type: "user.created";
  readonly occurredAt: Date;
  readonly accountId: string;
  readonly actorUserId: string;
  readonly email: string;
  readonly userId: string;
}

export interface LoginSucceededInternalEvent {
  readonly type: "identity.login_succeeded";
  readonly occurredAt: Date;
  readonly accountId: string;
  readonly organizationId: string | null;
  readonly sessionId: string;
  readonly userId: string;
}

export interface LoginFailedInternalEvent {
  readonly type: "identity.login_failed";
  readonly occurredAt: Date;
  readonly email: string;
  readonly organizationId: string | null;
  readonly reason: string;
  readonly userId: string | null;
}

export interface LogoutSucceededInternalEvent {
  readonly type: "identity.logout_succeeded";
  readonly occurredAt: Date;
  readonly accountId: string;
  readonly organizationId: string | null;
  readonly sessionId: string;
  readonly userId: string;
}

export interface OrganizationCreatedInternalEvent {
  readonly type: "organization.created";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly name: string;
  readonly organizationId: string;
}

export interface OrganizationDeactivatedInternalEvent {
  readonly type: "organization.deactivated";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly organizationId: string;
}

export interface MembershipAssignedInternalEvent {
  readonly type: "membership.assigned";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly userId: string;
}

export interface RoleCreatedInternalEvent {
  readonly type: "access_control.role_created";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly name: string;
  readonly organizationId: string;
  readonly roleId: string;
}

export interface PermissionGrantedInternalEvent {
  readonly type: "access_control.permission_granted";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly permissionCode: string;
  readonly permissionId: string;
  readonly roleId: string;
}

export interface RoleAssignedInternalEvent {
  readonly type: "access_control.role_assigned";
  readonly occurredAt: Date;
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly roleId: string;
  readonly targetUserId: string;
}

export interface AuthorizationDeniedInternalEvent {
  readonly type: "authorization.denied";
  readonly occurredAt: Date;
  readonly method: string;
  readonly organizationId: string;
  readonly path: string;
  readonly permissionCode: string;
  readonly userId: string;
}

export type InternalEvent =
  | AuthorizationDeniedInternalEvent
  | LoginFailedInternalEvent
  | LoginSucceededInternalEvent
  | LogoutSucceededInternalEvent
  | MembershipAssignedInternalEvent
  | OrganizationCreatedInternalEvent
  | OrganizationDeactivatedInternalEvent
  | PermissionGrantedInternalEvent
  | RoleAssignedInternalEvent
  | RoleCreatedInternalEvent
  | UserCreatedInternalEvent;

export type InternalEventType = InternalEvent["type"];
