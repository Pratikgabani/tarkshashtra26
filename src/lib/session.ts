import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/src/models/user";

export const SESSION_COOKIE_NAME = "shikshasetu_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionClaims {
  sub: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const configuredSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-session-secret-change-me";
  }

  throw new Error("Missing JWT_SECRET or AUTH_SECRET environment variable");
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string): string | null {
  try {
    return Buffer.from(input, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signTokenPart(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(payload: {
  userId: string;
  role: UserRole;
  email: string;
}): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    sub: payload.userId,
    role: payload.role,
    email: payload.email,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_TTL_SECONDS,
  };

  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(claims));
  const signature = signTokenPart(`${header}.${body}`, getSessionSecret());

  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionClaims | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = signTokenPart(`${header}.${body}`, getSessionSecret());

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payloadJson = decodeBase64Url(body);
  if (!payloadJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(payloadJson) as Partial<SessionClaims>;
    if (
      typeof parsed.sub !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed as SessionClaims;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionClaims | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
