import type { Role } from "../api/auth";
import { Badge, BadgeVariant } from "./Badge";

const ROLES: Record<Exclude<Role, "U">, [BadgeVariant, string]> = {
  SA: ["sa", "PLATFORM ADMIN"],
  OA: ["oa", "ORG ADMIN"],
  MEMBER: ["member", "MEMBER"],
  VIEWER: ["warning", "VIEWER"],
};

// Role tag next to a person's name (account header, directory, profile).
export function UserRoleBadge({ role }: { role: Exclude<Role, "U"> }) {
  const [variant, label] = ROLES[role];
  return <Badge variant={variant}>{label}</Badge>;
}
