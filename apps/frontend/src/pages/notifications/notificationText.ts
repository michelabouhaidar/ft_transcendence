import { AppNotification } from "../../api/notifications";

// Words a stored notification.
const ROLE: Record<string, string> = { OA: "Org Admin", MEMBER: "Member", VIEWER: "Viewer" };
const STATUS: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const FIELD: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  dueDate: "due date",
  firstName: "first name",
  lastName: "last name",
  jobTitle: "job title",
  bio: "bio",
};

const list = (v: unknown) => (Array.isArray(v) ? v.map((f) => FIELD[String(f)] ?? String(f)).join(", ") : "");

interface NotificationText {
  text: string;
  // Second line
  detail?: string;
}

export function describeNotification(n: AppNotification, meId: string | undefined): NotificationText {
  const p = n.params as Record<string, string | number | boolean | string[] | null | undefined>;
  const actor = n.actor?.name ?? "Someone";
  const role = ROLE[String(p.role)] ?? String(p.role ?? "");
  const org = String(p.orgName ?? "your organization");
  const project = `${p.projectName ?? ""}${p.projectKey ? ` (${p.projectKey})` : ""}`;
  const task = `${p.projectKey}-${p.number}`;
  const taskDetail = p.title ? String(p.title) : undefined;
  const member = p.memberId === meId ? "you" : String(p.memberName ?? "a member");

  switch (n.type) {
    case "account.password_changed":
      return { text: "Your password was changed." };
    case "account.password_reset":
      return { text: "Your password was reset with an emailed link." };
    case "account.2fa_enabled":
      return { text: "Two-factor authentication was turned on for your account." };
    case "account.2fa_disabled":
      return { text: "Two-factor authentication was turned off for your account." };
    case "account.locked":
      return { text: `Your account was locked for ${p.minutes ?? 15} minutes after too many failed sign-in attempts.` };
    case "account.suspended":
      return { text: `${actor} suspended your account.` };
    case "account.reactivated":
      return { text: `${actor} reactivated your account.` };
    case "account.updated":
      return { text: `${actor} edited your profile.`, detail: list(p.fields) ? `Changed: ${list(p.fields)}` : undefined };
    case "account.role_changed":
      return { text: p.systemAdmin ? `${actor} made you a System Admin.` : `${actor} removed your System Admin role.` };

    case "invitation.received":
      return {
        text: p.resent ? `${actor} resent your invitation to join ${org} as ${role}.` : `${actor} invited you to join ${org} as ${role}.`,
      };
    case "invitation.revoked":
      return { text: `${actor} cancelled your invitation to join ${org}.` };
    case "invitation.accepted":
      return { text: `${actor} accepted the invitation and joined ${org} as ${role}.` };
    case "invitation.declined":
      return { text: `${actor} declined the invitation to join ${org}.`, detail: p.email ? String(p.email) : undefined };

    case "org.updated":
      return {
        text: p.previousName ? `${actor} renamed ${p.previousName} to ${org}.` : `${actor} updated the details of ${org}.`,
      };
    case "org.deleted":
      return { text: `${actor} deleted the organization ${org}.` };

    case "membership.role_changed":
      return {
        text:
          member === "you"
            ? `${actor} changed your role in ${org} to ${ROLE[String(p.role)] ?? p.role}.`
            : `${actor} changed ${member}'s role to ${ROLE[String(p.role)] ?? p.role}.`,
      };
    case "membership.removed":
      return { text: `${actor} removed ${member} from ${org}.` };
    case "membership.left":
      return { text: `${p.memberName ?? actor} left ${org}.` };

    case "project.created":
      return { text: `${actor} created the project ${project}.` };
    case "project.updated":
      return {
        text: p.previousName
          ? `${actor} renamed the project ${p.previousName} to ${p.projectName}.`
          : `${actor} updated the project ${project}.`,
      };
    case "project.deleted":
      return { text: `${actor} deleted the project ${project}.` };
    case "project.access_granted":
      return { text: `${actor} gave you access to ${project}.` };
    case "project.access_revoked":
      return { text: `${actor} removed your access to ${project}.` };

    case "task.created":
      return {
        text: p.assigneeId === meId ? `${actor} created ${task} and assigned it to you.` : `${actor} created ${task}.`,
        detail: taskDetail,
      };
    case "task.updated":
      return { text: `${actor} edited ${task}${list(p.fields) ? ` (${list(p.fields)})` : ""}.`, detail: taskDetail };
    case "task.moved":
      return { text: `${actor} moved ${task} to ${STATUS[String(p.status)] ?? p.status}.`, detail: taskDetail };
    case "task.assigned": {
      let text: string;
      if (p.assigneeId && p.assigneeId === meId) text = `${actor} assigned ${task} to you.`;
      else if (p.previousAssigneeId && p.previousAssigneeId === meId)
        text = p.assigneeName ? `${actor} reassigned ${task} to ${p.assigneeName}.` : `${actor} unassigned you from ${task}.`;
      else if (!p.assigneeId && !p.previousAssigneeId) text = `${actor} assigned ${task} to you.`; // rows stored before NOTIF
      else text = p.assigneeName ? `${actor} assigned ${task} to ${p.assigneeName}.` : `${actor} unassigned ${task}.`;
      return { text, detail: taskDetail };
    }
    case "task.unassigned":
      return { text: `${actor} unassigned you from ${task}.`, detail: taskDetail };
    case "task.deleted":
      return { text: `${actor} deleted ${task}.`, detail: taskDetail };

    case "comment.created":
      return { text: `${actor} commented on ${task}.`, detail: taskDetail };
    case "comment.updated":
      return { text: `${actor} edited a comment on ${task}.`, detail: taskDetail };
    case "comment.deleted":
      return { text: `${actor} deleted your comment on ${task}.`, detail: taskDetail };

    case "friend.request_received":
      return { text: `${actor} sent you a friend request.` };
    case "friend.request_accepted":
      return { text: `${actor} accepted your friend request.` };
  }
  return { text: "You have a new notification." };
}

export const GONE_MESSAGE = "This item was deleted or you no longer have access to it.";
