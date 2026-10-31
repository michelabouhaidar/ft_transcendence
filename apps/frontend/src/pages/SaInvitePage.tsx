import { ShieldCheck } from "lucide-react";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { Card, useToast } from "../components";
import { InviteShell, NewAccountForm, useInvitation } from "./InvitePage";

// /sa-invite/:token (ADM-02): create a System Admin account from the emailed link.
export function SaInvitePage({ token }: { token: string }) {
  const toast = useToast();
  const { navigate } = useApp();
  const { user, isLoading: authLoading, setAuthData } = useAuth();
  const { invitation, accountExists, setAccountExists, deadLink, setDeadLink } = useInvitation(() => authApi.getSaInvitationByToken(token), token);

  return (
    <InviteShell deadLink={deadLink} home="/admin/users" loading={!invitation || authLoading}>
      {invitation && (
        <Card padding="lg" className="space-y-8">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{invitation.invitedByName} invited you to become a</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-brand-600" /> System Administrator
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              You'll manage users and organizations across the platform. System Administrators don't belong to an organization.
            </p>
          </div>
          <div className="border-t border-zinc-100 dark:border-dark-border pt-6">
            {user ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                You're signed in as {user.email}. Sign out first to create the System Administrator account for {invitation.email}.
              </p>
            ) : accountExists ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {invitation.email} already has a Trenno account. Ask a System Admin to grant you the role from your user page.
              </p>
            ) : (
              <NewAccountForm
                email={invitation.email}
                heading="Create your administrator account"
                submitLabel="Create account"
                submit={(payload) => authApi.acceptSaInvitation(token, payload)}
                onJoined={(u, org, newRole) => {
                  setAuthData(u, org, newRole);
                  toast.success("Welcome to Trenno", "Your System Administrator account is ready.");
                  navigate("/admin/users");
                }}
                onAccountExists={() => setAccountExists(true)}
                onDeadLink={(code, message) => setDeadLink({ code, message })}
              />
            )}
          </div>
        </Card>
      )}
    </InviteShell>
  );
}
