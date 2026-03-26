import type { Session } from "../entities/session.entity";

export const SESSION_REPOSITORY = Symbol("SESSION_REPOSITORY");

export interface SessionRepository {
  findById(sessionId: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  update(session: Session): Promise<void>;
}
