import crypto from "crypto";
import * as argon2 from "argon2";
import { Request, Response } from "express";
import { prisma } from "../app";
import { AccountStatus } from "@prisma/client";

export const SESSION_COOKIE_NAME = "trenno_session";
const SESSION_TTL_DAYS = 7;
const IDLE_TIMEOUT_HOURS = 12;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19 * 1024,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join("="));
    }
  });
  return list;
}

export function parseCookies(req: Request): Record<string, string> {
  return parseCookieHeader(req.headers.cookie);
}

export function setSessionCookie(res: Response, rawToken: string, maxAgeSeconds: number = SESSION_TTL_DAYS * 24 * 3600): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${rawToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSeconds}`
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
}

export async function createSession(userId: string, pending2fa: boolean = false): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const idHash = hashToken(rawToken);

  const expiresAt = new Date();
  if (pending2fa) {
    // 5 minutes pending step for 2FA (2FA-03)
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
  } else {
    expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  }

  await prisma.session.create({
    data: {
      idHash,
      userId,
      pending2fa,
      expiresAt,
      lastActivityAt: new Date(),
    },
  });

  return rawToken;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    bio: string | null;
    avatarPath: string | null;
    isSystemAdmin: boolean;
    status: AccountStatus;
  };
  organization: {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: Date | string;
  } | null;
  role: "SA" | "OA" | "MEMBER" | "VIEWER" | "U";
}

export async function getAuthContextFromRequest(req: Request): Promise<AuthContext | null> {
  return getAuthContextFromCookieHeader(req.headers.cookie);
}

// Shared by HTTP requests and the WebSocket handshake.
export async function getAuthContextFromCookieHeader(cookieHeader: string | undefined): Promise<AuthContext | null> {
  const cookies = parseCookieHeader(cookieHeader);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (!rawToken) return null;

  const idHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { idHash },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { organization: true },
          },
        },
      },
    },
  });

  if (!session) return null;

  // Check if session revoked or expired
  const now = new Date();
  if (session.revokedAt || session.expiresAt < now) {
    return null;
  }

  // Check 2FA pending: full auth requires pending2fa === false
  if (session.pending2fa) {
    return null;
  }

  // Check idle timeout (12h)
  const idleLimit = new Date(now.getTime() - IDLE_TIMEOUT_HOURS * 3600 * 1000);
  if (session.lastActivityAt < idleLimit) {
    await prisma.session.update({
      where: { idHash },
      data: { revokedAt: now },
    });
    return null;
  }

  // Check user status
  const user = session.user;
  if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DELETED || user.deletedAt) {
    // Revoke all sessions immediately
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { revokedAt: now },
    });
    return null;
  }

  // Bump activity timestamp if older than 5 minutes
  if (now.getTime() - session.lastActivityAt.getTime() > 5 * 60 * 1000) {
    await prisma.session.update({
      where: { idHash },
      data: { lastActivityAt: now },
    });
  }

  // Determine user role and active organization
  let role: "SA" | "OA" | "MEMBER" | "VIEWER" | "U" = "U";
  let activeOrg: { id: string; name: string; description?: string | null; createdAt?: Date | string } | null = null;

  if (user.isSystemAdmin) {
    role = "SA";
  }

  const activeMembership = user.memberships[0];
  // A System Admin belongs to no organization (§4.1), even if an old membership row is still active.
  if (!user.isSystemAdmin && activeMembership && activeMembership.organization && !activeMembership.organization.deletedAt) {
    activeOrg = {
      id: activeMembership.organization.id,
      name: activeMembership.organization.name,
      description: activeMembership.organization.description,
      createdAt: activeMembership.organization.createdAt,
    };
    if (role !== "SA") {
      role = activeMembership.role as "OA" | "MEMBER" | "VIEWER";
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatarPath: user.avatarPath,
      isSystemAdmin: user.isSystemAdmin,
      status: user.status,
    },
    organization: activeOrg,
    role,
  };
}

// Sends 401 and returns null when the request has no valid session.
export async function requireAuth(req: Request, res: Response): Promise<AuthContext | null> {
  const ctx = await getAuthContextFromRequest(req);
  if (!ctx) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "You must be logged in to perform this action." } });
    return null;
  }
  return ctx;
}
