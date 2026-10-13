-- ==============================================================================
-- Trenno Database Initialization Script
-- Spec: b_Trenno_Requirements_Specification.md (§10 Data Model, spec v b-1.3)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PostgreSQL Extensions
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 2. Enumerated Types
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "AccountStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrgRole" AS ENUM ('OA', 'MEMBER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationRole" AS ENUM ('OA', 'MEMBER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AuthTokenType" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Core Tables
-- ------------------------------------------------------------------------------

-- User accounts and authentication profiles
CREATE TABLE IF NOT EXISTS "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" CITEXT UNIQUE NOT NULL,
  "password_hash" TEXT,
  "first_name" VARCHAR(50) NOT NULL,
  "last_name" VARCHAR(50) NOT NULL,
  "job_title" VARCHAR(100),
  "bio" VARCHAR(500),
  "avatar_path" TEXT,
  "is_system_admin" BOOLEAN NOT NULL DEFAULT false,
  "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "failed_login_count" INT NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ,
  "last_login_at" TIMESTAMPTZ,
  "last_seen_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

-- Tenant organizations
CREATE TABLE IF NOT EXISTS "organization" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(1000),
  "created_by_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_id" UUID REFERENCES "user"("id") ON DELETE RESTRICT
);

-- Organization memberships
CREATE TABLE IF NOT EXISTS "membership" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organization"("id") ON DELETE RESTRICT,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "left_at" TIMESTAMPTZ
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS "invitation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organization"("id") ON DELETE RESTRICT,
  "email" CITEXT NOT NULL,
  "role" "InvitationRole" NOT NULL,
  "token_hash" CHAR(64) UNIQUE NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invited_by_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invitation to become System Admin (not tied to an organization)
CREATE TABLE IF NOT EXISTS "sa_invitation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" CITEXT NOT NULL,
  "token_hash" CHAR(64) UNIQUE NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invited_by_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email verification and password reset tokens
CREATE TABLE IF NOT EXISTS "auth_token" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "type" "AuthTokenType" NOT NULL,
  "token_hash" CHAR(64) UNIQUE NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active user login sessions
CREATE TABLE IF NOT EXISTS "session" (
  "id_hash" CHAR(64) PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "pending_2fa" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Two-Factor Authentication credentials
CREATE TABLE IF NOT EXISTS "two_factor" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID UNIQUE NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "secret_encrypted" BYTEA NOT NULL,
  "enabled_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2FA backup recovery codes
CREATE TABLE IF NOT EXISTS "recovery_code" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "code_hash" TEXT NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Peer friendships
CREATE TABLE IF NOT EXISTS "friendship" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "requester_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "addressee_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_friendship_distinct" CHECK ("requester_id" <> "addressee_id")
);

-- Projects scoped to organizations
CREATE TABLE IF NOT EXISTS "project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL REFERENCES "organization"("id") ON DELETE RESTRICT,
  "key" VARCHAR(6) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(2000),
  "start_date" DATE,
  "target_date" DATE,
  "task_counter" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_id" UUID REFERENCES "user"("id") ON DELETE RESTRICT,
  CONSTRAINT "chk_project_dates" CHECK ("target_date" IS NULL OR "start_date" IS NULL OR "target_date" >= "start_date")
);

-- Granular project access
CREATE TABLE IF NOT EXISTS "project_access" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "project"("id") ON DELETE RESTRICT,
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "granted_by_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "granted_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revoked_at" TIMESTAMPTZ
);

-- Kanban board tasks
CREATE TABLE IF NOT EXISTS "task" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL REFERENCES "project"("id") ON DELETE RESTRICT,
  "number" INT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "position" DOUBLE PRECISION NOT NULL DEFAULT 65536,
  "due_date" DATE,
  "creator_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "assignee_id" UUID REFERENCES "user"("id") ON DELETE SET NULL,
  "version" INT NOT NULL DEFAULT 1,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_id" UUID REFERENCES "user"("id") ON DELETE RESTRICT
);

-- Task discussion comments
CREATE TABLE IF NOT EXISTS "comment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL REFERENCES "task"("id") ON DELETE RESTRICT,
  "author_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "body" VARCHAR(5000) NOT NULL,
  "edited_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_id" UUID REFERENCES "user"("id") ON DELETE RESTRICT
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS "notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "actor_id" UUID REFERENCES "user"("id") ON DELETE RESTRICT,
  "type" VARCHAR(50) NOT NULL,
  "params" JSONB NOT NULL,
  "resource_type" VARCHAR(30) NOT NULL,
  "resource_id" UUID NOT NULL,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 4. Indexes & Partial Unique Constraints
-- ------------------------------------------------------------------------------

-- Organization partial unique name (active orgs only)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_org_name_unique"
  ON "organization" (lower("name"))
  WHERE "deleted_at" IS NULL;

-- Membership partial unique constraint: at most one active organization per user
CREATE UNIQUE INDEX IF NOT EXISTS "idx_membership_user_active"
  ON "membership" ("user_id")
  WHERE "status" = 'ACTIVE';

-- Invitation partial unique pending invitation per email per org
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitation_pending"
  ON "invitation" ("org_id", "email")
  WHERE "status" = 'PENDING';

-- Friendship symmetric pair partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS "idx_friendship_pair"
  ON "friendship" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"))
  WHERE "status" IN ('PENDING', 'ACCEPTED');

-- Project partial unique name and key per organization
CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_org_name"
  ON "project" ("org_id", lower("name"))
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_org_key"
  ON "project" ("org_id", "key")
  WHERE "deleted_at" IS NULL;

-- Project access partial unique grant (active grants only)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_access_active"
  ON "project_access" ("project_id", "user_id")
  WHERE "revoked_at" IS NULL;

-- Task numbering and board ordering
CREATE UNIQUE INDEX IF NOT EXISTS "idx_task_project_number"
  ON "task" ("project_id", "number");

CREATE INDEX IF NOT EXISTS "idx_task_kanban_order"
  ON "task" ("project_id", "status", "position");

CREATE INDEX IF NOT EXISTS "idx_task_title_trgm"
  ON "task" USING gin ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_task_description_trgm"
  ON "task" USING gin ("description" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_task_assignee"
  ON "task" ("assignee_id");

CREATE INDEX IF NOT EXISTS "idx_task_due_date"
  ON "task" ("due_date");

-- Comment task timeline index
CREATE INDEX IF NOT EXISTS "idx_comment_task_created"
  ON "comment" ("task_id", "created_at");

-- Notification inbox index
CREATE INDEX IF NOT EXISTS "idx_notification_user_inbox"
  ON "notification" ("user_id", "read_at", "created_at" DESC);

-- Session expiry index for cleanup
CREATE INDEX IF NOT EXISTS "idx_session_expires_at"
  ON "session" ("expires_at");
