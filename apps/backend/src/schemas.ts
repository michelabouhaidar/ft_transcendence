import { z } from "zod";

// ==========================================
// Domain Enums matching b_Trenno spec (§10)
// ==========================================

export enum AccountStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum OrgRole {
  OA = "OA",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  REMOVED = "REMOVED",
}

export enum InvitationRole {
  OA = "OA",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  REVOKED = "REVOKED",
}

export enum AuthTokenType {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  RESET_PASSWORD = "RESET_PASSWORD",
}

export enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  REMOVED = "REMOVED",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum NotificationCategory {
  TASK = "TASK",
  COMMENT = "COMMENT",
  PROJECT = "PROJECT",
  ORGANIZATION = "ORGANIZATION",
  FRIEND = "FRIEND",
  ACCOUNT = "ACCOUNT",
}

// ==========================================
// Shared Validation Schemas (§7.6)
// ==========================================

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254, "Email must not exceed 254 characters");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

export const NameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name must not exceed 50 characters");

export const SignUpSchema = z
  .object({
    firstName: NameSchema,
    lastName: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    passwordConfirmation: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy" }),
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const TwoFactorLoginSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Code must be at least 6 characters")
    .max(32, "Invalid code length"),
  isRecoveryCode: z.boolean().optional(),
});

export const TwoFactorSetupSchema = z.object({
  password: z.string().min(1, "Password is required to set up 2FA"),
});

export const TwoFactorEnableSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain digits only"),
});

export const TwoFactorDisableSchema = z.object({
  password: z.string().min(1, "Password is required to disable 2FA"),
  code: z
    .string()
    .trim()
    .min(6, "Code must be at least 6 characters")
    .max(32, "Invalid code length"),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: PasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const ResendVerificationSchema = z.object({
  email: EmailSchema,
});

export const CreateOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
});

// USR-01: every field optional; empty job title / bio clears the field.
export const UpdateProfileSchema = z.object({
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  jobTitle: z
    .string()
    .trim()
    .max(100, "Job title must not exceed 100 characters")
    .nullable()
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must not exceed 500 characters")
    .nullable()
    .optional(),
});

export const FriendRequestSchema = z.object({
  userId: z.string().uuid("Invalid user"),
});

// PRJ-01, PRJ-03 (§7.6): dates are calendar days (YYYY-MM-DD); empty or null clears them.
const ProjectDateSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must use the YYYY-MM-DD format")
      .refine((v) => !isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), "Invalid date"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === "" ? null : v));

const ProjectNameSchema = z
  .string()
  .trim()
  .min(2, "Project name must be at least 2 characters")
  .max(100, "Project name must not exceed 100 characters");

const ProjectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must not exceed 2000 characters")
  .nullable()
  .optional();

export const PROJECT_KEY_RE = /^[A-Z][A-Z0-9]{1,5}$/;

function datesInOrder(d: { startDate?: string | null; targetDate?: string | null }) {
  return !d.startDate || !d.targetDate || d.targetDate >= d.startDate;
}
const DATE_ORDER_MESSAGE = { message: "The target date can't be before the start date", path: ["targetDate"] };

export const CreateProjectSchema = z
  .object({
    name: ProjectNameSchema,
    key: z
      .string()
      .trim()
      .regex(PROJECT_KEY_RE, "Project key must start with a letter and use 2 to 6 uppercase letters or digits"),
    description: ProjectDescriptionSchema,
    startDate: ProjectDateSchema,
    targetDate: ProjectDateSchema,
    orgId: z.string().uuid("Invalid organization").optional(),
  })
  .refine(datesInOrder, DATE_ORDER_MESSAGE);

// The key is immutable; the route refuses a different one before this schema runs.
export const UpdateProjectSchema = z.object({
  name: ProjectNameSchema.optional(),
  description: ProjectDescriptionSchema,
  startDate: ProjectDateSchema,
  targetDate: ProjectDateSchema,
});

// TSK-01…04 (§7.6): unknown fields are refused; dates are YYYY-MM-DD between 2000 and 2100.
const TaskDueDateSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must use the YYYY-MM-DD format")
      .refine((v) => !isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), "Invalid date")
      .refine((v) => v >= "2000-01-01" && v <= "2100-12-31", "Dates must be between 2000 and 2100"),
    z.literal(""),
    z.null(),
  ])
  .transform((v) => (v === "" ? null : v));

const TaskFields = {
  title: z.string().trim().min(1, "A title is required").max(200, "Title must not exceed 200 characters"),
  description: z.string().max(10000, "Description must not exceed 10000 characters").nullable(),
  status: z.nativeEnum(TaskStatus, { errorMap: () => ({ message: "Status must be To Do, In Progress or Done" }) }),
  priority: z.nativeEnum(TaskPriority, { errorMap: () => ({ message: "Priority must be Low, Medium, High or Urgent" }) }),
  dueDate: TaskDueDateSchema,
  assigneeId: z.string().uuid("Invalid assignee").nullable(),
};

export const CreateTaskSchema = z
  .object({
    title: TaskFields.title,
    description: TaskFields.description.optional(),
    status: TaskFields.status.optional(),
    priority: TaskFields.priority.optional(),
    dueDate: TaskFields.dueDate.optional(),
    assigneeId: TaskFields.assigneeId.optional(),
  })
  .strict();

export const UpdateTaskSchema = z
  .object({
    title: TaskFields.title.optional(),
    description: TaskFields.description.optional(),
    status: TaskFields.status.optional(),
    priority: TaskFields.priority.optional(),
    dueDate: TaskFields.dueDate.optional(),
    assigneeId: TaskFields.assigneeId.optional(),
    version: z.number().int().positive("A version is required"),
  })
  .strict();

// TSK-06: target column and index within it (after the card is taken out of its old place).
export const MoveTaskSchema = z
  .object({
    status: TaskFields.status,
    index: z.number().int().min(0),
    version: z.number().int().positive("A version is required"),
  })
  .strict();

// TSK-11
export const CommentSchema = z
  .object({
    body: z.string().trim().min(1, "A comment can't be empty").max(5000, "Comment must not exceed 5000 characters"),
  })
  .strict();
