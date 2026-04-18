import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/src/models/user";
import { getSessionFromRequest, type SessionClaims } from "@/src/lib/session";

type RoleSessionResult =
  | { ok: true; session: SessionClaims }
  | { ok: false; response: NextResponse };

type ScopedUserIdResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export function requireRoleSession(request: NextRequest, requiredRole: UserRole): RoleSessionResult {
  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.role !== requiredRole) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}

export function resolveScopedUserId(
  sessionUserId: string,
  providedUserId?: string | null
): ScopedUserIdResult {
  const normalizedProvidedId = providedUserId?.trim();

  if (normalizedProvidedId && normalizedProvidedId !== sessionUserId) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: normalizedProvidedId || sessionUserId };
}
