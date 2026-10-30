import { InvitationStatus, MembershipStatus, OrgRole } from "@prisma/client";
import { prisma } from "../app";
import { endFriendshipsForUser } from "./friends";
import { sendMemberRemovedEmail, sendOrgDeletedEmail, sendRoleChangedEmail } from "./mailer";

export class OrgError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

// Organization names are unique among live organizations (a deleted name can be reused).
export async function findActiveOrgByName(name: string, excludeId?: string) {
  return prisma.organization.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

// ORG-03
export async function updateOrganization(orgId: string, actorId: string, data: { name: string; description?: string | null }) {
  const org = await prisma.organization.findFirst({ where: { id: orgId, deletedAt: null } });
  if (!org) throw new OrgError(404, "NOT_FOUND", "Organization not found.");
  if (await findActiveOrgByName(data.name, org.id)) {
    throw new OrgError(409, "ORG_NAME_TAKEN", `An organization named "${data.name}" already exists.`);
  }
  try {
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: { name: data.name, description: data.description || null },
    });
    return updated;
  } catch (err: any) {
    if (err?.code === "P2002") throw new OrgError(409, "ORG_NAME_TAKEN", `An organization named "${data.name}" already exists.`);
    throw err;
  }
}

// ORG-04: typed name; soft-deletes the org and everything under it, revokes pending invitations,
// ends memberships and the friendships between its members, and emails every member.
export async function deleteOrganization(orgId: string, actorId: string, confirmName: string) {
  const org = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: { user: { select: { id: true, email: true, firstName: true } } },
      },
    },
  });
  if (!org) throw new OrgError(404, "NOT_FOUND", "Organization not found.");
  if (confirmName !== org.name) {
    throw new OrgError(400, "CONFIRMATION_MISMATCH", "The typed name doesn't match the organization name.");
  }

  const memberIds = org.memberships.map((m) => m.userId);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const projects = await tx.project.findMany({ where: { orgId: org.id, deletedAt: null }, select: { id: true } });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length) {
      await tx.comment.updateMany({
        where: { deletedAt: null, task: { projectId: { in: projectIds } } },
        data: { deletedAt: now, deletedById: actorId },
      });
      await tx.task.updateMany({
        where: { deletedAt: null, projectId: { in: projectIds } },
        data: { deletedAt: now, deletedById: actorId },
      });
      await tx.projectAccess.updateMany({
        where: { revokedAt: null, projectId: { in: projectIds } },
        data: { revokedAt: now },
      });
      await tx.project.updateMany({
        where: { id: { in: projectIds } },
        data: { deletedAt: now, deletedById: actorId },
      });
    }

    await tx.invitation.updateMany({
      where: { orgId: org.id, status: InvitationStatus.PENDING },
      data: { status: InvitationStatus.REVOKED },
    });
    await tx.membership.updateMany({
      where: { orgId: org.id, status: MembershipStatus.ACTIVE },
      data: { status: MembershipStatus.REMOVED, leftAt: now },
    });
    if (memberIds.length > 1) {
      await tx.friendship.updateMany({
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          requesterId: { in: memberIds },
          addresseeId: { in: memberIds },
        },
        data: { status: "REMOVED" },
      });
    }
    await tx.organization.update({ where: { id: org.id }, data: { deletedAt: now, deletedById: actorId } });
  });

  await Promise.all(
    org.memberships.map((m) =>
      sendOrgDeletedEmail(m.user.email, m.user.firstName, org.name).catch((err) =>
        console.warn("[Orgs] Could not send org deletion email:", err)
      )
    )
  );

  return { name: org.name, memberCount: memberIds.length };
}

async function activeMembership(orgId: string, userId: string) {
  const m = await prisma.membership.findFirst({
    where: { orgId, userId, status: MembershipStatus.ACTIVE, organization: { deletedAt: null } },
    include: { user: { select: { email: true, firstName: true, lastName: true } }, organization: { select: { name: true } } },
  });
  if (!m) throw new OrgError(404, "NOT_FOUND", "That person isn't a member of this organization.");
  return m;
}

async function activeOrgAdminCount(orgId: string) {
  return prisma.membership.count({ where: { orgId, role: OrgRole.OA, status: MembershipStatus.ACTIVE } });
}

// ORG-06: how many tasks would be unassigned if this member became a Viewer.
export async function countAssignedTasks(orgId: string, userId: string) {
  await activeMembership(orgId, userId);
  return prisma.task.count({ where: { assigneeId: userId, deletedAt: null, project: { orgId, deletedAt: null } } });
}

// ORG-06: Member <-> Viewer. Becoming a Viewer unassigns their tasks.
export async function changeMemberRole(orgId: string, userId: string, role: "MEMBER" | "VIEWER", actorId: string) {
  const m = await activeMembership(orgId, userId);
  if (m.role === OrgRole.OA) {
    throw new OrgError(409, "IS_ORG_ADMIN", "Org Admin roles are managed by a System Admin.");
  }
  if (m.role === role) throw new OrgError(409, "NO_CHANGE", `This person is already a ${role === "VIEWER" ? "Viewer" : "Member"}.`);

  let unassignedTasks = 0;
  await prisma.$transaction(async (tx) => {
    await tx.membership.update({ where: { id: m.id }, data: { role } });
    if (role === OrgRole.VIEWER) {
      const r = await tx.task.updateMany({
        where: { assigneeId: userId, deletedAt: null, project: { orgId } },
        data: { assigneeId: null },
      });
      unassignedTasks = r.count;
    }
  });

  await sendRoleChangedEmail(m.user.email, m.user.firstName, `Organization role changed to ${role}`).catch((err) =>
    console.warn("[Orgs] Could not send role change email:", err)
  );
  return { unassignedTasks };
}

// ORG-07: removal by an admin or leaving. Ends the membership (left_at), revokes project access,
// unassigns tasks and ends friendships. Their tasks and comments stay. Only a removed user gets an email.
export async function endMembership(orgId: string, userId: string, how: "removed" | "left", actorId: string) {
  const m = await activeMembership(orgId, userId);
  if (m.role === OrgRole.OA && (await activeOrgAdminCount(orgId)) <= 1) {
    throw new OrgError(
      409,
      "LAST_ORG_ADMIN",
      how === "left"
        ? "You're the last Org Admin. Appoint another Org Admin before leaving, or delete the organization."
        : "This person is the last Org Admin. Appoint another Org Admin first, or delete the organization."
    );
  }

  const now = new Date();
  let unassignedTasks = 0;
  await prisma.$transaction(async (tx) => {
    await tx.membership.update({ where: { id: m.id }, data: { status: MembershipStatus.REMOVED, leftAt: now } });
    await tx.projectAccess.updateMany({
      where: { userId, revokedAt: null, project: { orgId } },
      data: { revokedAt: now },
    });
    const r = await tx.task.updateMany({
      where: { assigneeId: userId, deletedAt: null, project: { orgId } },
      data: { assigneeId: null },
    });
    unassignedTasks = r.count;
    await endFriendshipsForUser(tx, userId);
  });

  if (how === "removed") {
    await sendMemberRemovedEmail(m.user.email, m.user.firstName, m.organization.name).catch((err) =>
      console.warn("[Orgs] Could not send removal email:", err)
    );
  }
  return { unassignedTasks };
}
