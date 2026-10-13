import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Building2, Camera, Check, Copy, Download, KeyRound, Lock, ShieldAlert, ShieldCheck, Trash2, Unlock, User as UserIcon } from "lucide-react";
import { authApi, User } from "../api/auth";
import { usersApi } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../lib/hooks";
import { Alert } from "./Alert";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { PasswordChecklist, PasswordMatchIndicator } from "./PasswordChecklist";
import { Tabs } from "./Tabs";
import { Textarea } from "./Textarea";
import { UserRoleBadge } from "./UserRoleBadge";

const TABS = [
  { id: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
  { id: "security", label: "Password", icon: <KeyRound className="w-4 h-4" /> },
  { id: "2fa", label: "2FA Security", icon: <Lock className="w-4 h-4" /> },
];

// Account settings for the signed-in user: profile and photo (USR-02), password (AUTH-06), 2FA (2FA-01…04).
// Tab contents mount with the dialog, so every open starts from fresh state.
export function AccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, organization, role, setAuthData } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  if (!user) return null;
  const onUserUpdated = (updated: User) => setAuthData(updated, organization, role ?? "U");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings" maxWidth="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-dark-card">
          <Avatar size="lg" name={`${user.firstName} ${user.lastName}`} src={user.avatarPath || undefined} colorSeed={user.id} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-base text-zinc-950 dark:text-white font-sans truncate">
                {user.firstName} {user.lastName}
              </span>
              {role && role !== "U" && <UserRoleBadge role={role} />}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-0.5 truncate">{user.email}</div>
            <div className="text-xs text-zinc-400 font-sans mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{organization ? organization.name : "No Workspace Assigned"}</span>
            </div>
            <AvatarControls user={user} onUserUpdated={onUserUpdated} />
          </div>
        </div>

        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "profile" && <ProfileTab user={user} onClose={onClose} onUserUpdated={onUserUpdated} />}
        {activeTab === "security" && <PasswordTab onClose={onClose} />}
        {activeTab === "2fa" && <TwoFactorTab email={user.email} onClose={onClose} />}
      </div>
    </Modal>
  );
}

function AvatarControls({ user, onUserUpdated }: { user: User; onUserUpdated: (u: User) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { busy, error, setError, run } = useAsync();

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Choose a JPEG, PNG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setError("The image must be 2 MB or smaller.");
    run(async () => onUserUpdated({ ...user, avatarPath: (await usersApi.uploadAvatar(file)).avatarPath }));
  };

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
        <Button variant="outline" size="sm" isLoading={busy} leftIcon={<Camera className="w-3.5 h-3.5" />} onClick={() => fileInputRef.current?.click()}>
          {user.avatarPath ? "Change photo" : "Upload photo"}
        </Button>
        {user.avatarPath && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() =>
              run(async () => {
                await usersApi.removeAvatar();
                onUserUpdated({ ...user, avatarPath: null });
              })
            }
          >
            Remove
          </Button>
        )}
        <span className="text-[11px] text-zinc-400">JPEG, PNG or WebP, up to 2 MB</span>
      </div>
      {error && (
        <Alert appearance="inline" variant="error" className="mt-2">
          {error}
        </Alert>
      )}
    </>
  );
}

// Success / error lines at the top of each tab.
function Status({ success, error }: { success?: string | null; error?: string | null }) {
  return (
    <>
      {success && (
        <Alert appearance="inline" variant="success">
          {success}
        </Alert>
      )}
      {error && (
        <Alert appearance="inline" variant="error">
          {error}
        </Alert>
      )}
    </>
  );
}

function Footer({ children, justify = "end" }: { children: ReactNode; justify?: "end" | "between" }) {
  return <div className={`flex gap-3 items-center pt-3 border-t border-zinc-200 dark:border-dark-border ${justify === "end" ? "justify-end" : "justify-between"}`}>{children}</div>;
}

const submitted = (fn: () => void) => (e: FormEvent) => {
  e.preventDefault();
  fn();
};

function ProfileTab({ user, onClose, onUserUpdated }: { user: User; onClose: () => void; onUserUpdated: (u: User) => void }) {
  const [form, setForm] = useState({ firstName: user.firstName || "", lastName: user.lastName || "", jobTitle: user.jobTitle || "", bio: user.bio || "" });
  const [success, setSuccess] = useState<string | null>(null);
  const { busy, error, setError, run } = useAsync();
  const field = (key: keyof typeof form) => ({ value: form[key], onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }) });

  const save = async () => {
    setSuccess(null);
    if (!form.firstName.trim() || !form.lastName.trim()) return setError("First name and last name are required.");
    const res = await run(() =>
      authApi.updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), jobTitle: form.jobTitle.trim() || null, bio: form.bio.trim() || null })
    );
    if (res) {
      setSuccess("Profile updated successfully.");
      if (res.user) onUserUpdated(res.user);
    }
  };

  return (
    <form onSubmit={submitted(save)} className="space-y-4 pt-1">
      <Status success={success} error={error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" {...field("firstName")} required maxLength={50} />
        <Input label="Last Name" {...field("lastName")} required maxLength={50} />
      </div>
      <Input label="Email Address" value={user.email} disabled helperText="Email address cannot be changed." />
      <Input label="Job Title" {...field("jobTitle")} placeholder="e.g. Lead Frontend Engineer" maxLength={100} />
      <Textarea label="Bio / Status Note" {...field("bio")} placeholder="Brief description of your role or responsibilities..." rows={3} maxLength={500} />
      <Footer>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button size="sm" type="submit" isLoading={busy}>
          Save Profile
        </Button>
      </Footer>
    </form>
  );
}

function PasswordTab({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const { busy, error, setError, run } = useAsync();

  const save = async () => {
    setSuccess(null);
    if (!current) return setError("Current password is required.");
    if (next.length < 8) return setError("New password must be at least 8 characters long.");
    if (next !== confirm) return setError("New passwords do not match.");
    if (await run(() => authApi.changePassword({ currentPassword: current, newPassword: next }))) {
      setSuccess("Password updated successfully. Other sessions have been revoked.");
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <form onSubmit={submitted(save)} className="space-y-4 pt-1">
      <Status success={success} error={error} />
      <Input label="Current Password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required placeholder="Enter your current password" />
      <Input label="New Password" type="password" value={next} onChange={(e) => setNext(e.target.value)} required placeholder="Enter new secure password" />
      <PasswordChecklist password={next} />
      <Input label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirm your new password" />
      <PasswordMatchIndicator password={next} confirmPassword={confirm} />
      <Footer>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" type="submit" isLoading={busy}>
          Change Password
        </Button>
      </Footer>
    </form>
  );
}

function recoveryText(email: string, codes: string[]) {
  return (
    `TRENNO TWO-FACTOR AUTHENTICATION RECOVERY CODES\nAccount: ${email}\nDate: ${new Date().toLocaleDateString()}\n\n` +
    codes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
    `\n\nNotice: Each code can only be used once. Keep these codes in a safe place.`
  );
}

// "Copied" for two seconds after copying.
function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  return [
    copied,
    (text) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
  ];
}

type Step = "status" | "disable" | "password" | "qr" | "codes";

function TwoFactorTab({ email, onClose }: { email: string; onClose: () => void }) {
  const [status, setStatus] = useState<{ enabled: boolean; remaining: number } | null>(null);
  const [step, setStep] = useState<Step>("status");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState({ secret: "", qr: "" });
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedSecret, copySecret] = useCopied();
  const [copiedCodes, copyCodes] = useCopied();
  const { busy, error, setError, run } = useAsync();

  const loadStatus = () =>
    authApi
      .get2faStatus()
      .then((r) => setStatus({ enabled: r.enabled, remaining: r.remainingRecoveryCodes ?? 0 }))
      .catch(() => setStatus({ enabled: false, remaining: 0 }));

  useEffect(() => {
    loadStatus();
  }, []);

  const go = (next: Step) => {
    setStep(next);
    setNotice(null);
    setPassword("");
    setCode("");
    setError(null);
  };

  const start = async () => {
    if (!password) return setError("Password is required to initiate 2FA setup.");
    const res = await run(() => authApi.setup2fa({ password }));
    if (res) {
      setSetup({ secret: res.secret, qr: res.qrCodeDataUrl });
      go("qr");
    }
  };

  const activate = async () => {
    if (code.trim().length !== 6) return setError("Please enter a valid 6-digit verification code.");
    const res = await run(() => authApi.enable2fa({ code: code.trim() }));
    if (res) {
      setRecoveryCodes(res.recoveryCodes || []);
      go("codes");
      loadStatus();
    }
  };

  const disable = async () => {
    if (!password || !code.trim()) return setError("Both current password and verification code are required.");
    if (await run(() => authApi.disable2fa({ password, code: code.trim() }))) {
      go("status");
      setNotice("Two-factor authentication has been disabled. A confirmation email was sent to your inbox.");
      loadStatus();
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([recoveryText(email, recoveryCodes)], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "trenno-2fa-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!status) return <div className="py-8 text-center text-xs text-zinc-500 font-sans">Loading two-factor authentication status...</div>;

  const cancel = (
    <Button variant="outline" size="sm" onClick={() => go("status")}>
      Cancel
    </Button>
  );
  const close = (
    <Button variant="outline" size="sm" onClick={onClose}>
      Close
    </Button>
  );
  const heading = (title: string, text: string) => (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">{title}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{text}</p>
    </div>
  );

  return (
    <div className="space-y-5 pt-1">
      {step === "status" && notice && (
        <Alert appearance="inline" variant="success">
          {notice}
        </Alert>
      )}

      {step === "status" && status.enabled && (
        <div className="space-y-5">
          <div className="p-4 border border-success-500/20 bg-success-50/50 dark:bg-success-950/20 flex items-start gap-3">
            <div className="p-2 bg-success-500/10 text-success-600 dark:text-success-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-sans">Two-Factor Authentication is Active</span>
                <Badge variant="success">ENABLED</Badge>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans mt-0.5">Your account is protected by TOTP authenticator security.</p>
            </div>
          </div>
          <div className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-dark-card space-y-3">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-zinc-600 dark:text-zinc-400">Emergency Recovery Codes:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {status.remaining} code{status.remaining === 1 ? "" : "s"} remaining
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
              Single-use recovery codes permit emergency sign-in if your authenticator device is lost. Each used code is permanently invalidated.
            </p>
          </div>
          <Footer justify="between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => go("disable")}
              className="text-destructive-600 dark:text-destructive-400 hover:border-destructive-400"
              leftIcon={<Unlock className="w-3.5 h-3.5" />}
            >
              Disable 2FA
            </Button>
            {close}
          </Footer>
        </div>
      )}

      {step === "status" && !status.enabled && (
        <div className="space-y-5">
          <div className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-dark-card flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-sm text-zinc-950 dark:text-white font-sans">
                <Lock className="w-4 h-4 text-brand-600" />
                <span>Two-Factor Authentication (TOTP)</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-1">Protect your account by requiring an authenticator code during login.</p>
            </div>
            <Badge variant="warning" size="md">
              DISABLED
            </Badge>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed space-y-2">
            <p>
              Two-Factor Authentication prevents unauthorized access even if your password becomes compromised. You will need a time-based one-time password (TOTP)
              from an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, or 1Password) each time you log in.
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">10 single-use recovery codes will also be generated to ensure you never lose access to your account.</p>
          </div>
          <Footer justify="between">
            <Button size="sm" onClick={() => go("password")} leftIcon={<ShieldCheck className="w-4 h-4" />}>
              Enable Two-Factor Authentication
            </Button>
            {close}
          </Footer>
        </div>
      )}

      {/* 2FA-04: password and a valid code; a confirmation email follows. */}
      {step === "disable" && (
        <form onSubmit={submitted(disable)} className="space-y-4">
          <Alert variant="warning" icon={<ShieldAlert className="w-4 h-4" />} title="Disable Two-Factor Authentication">
            Disabling 2FA lowers your account defense. A confirmation notice will be emailed to your inbox upon deactivation.
          </Alert>
          <Status error={error} />
          <Input label="Confirm Account Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your current password" />
          <Input
            label="Current 6-Digit Code or Recovery Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. 123456 or ABCD-1234"
            autoComplete="one-time-code"
            helperText="Enter the 6-digit code from your authenticator app or one of your remaining emergency recovery codes."
          />
          <Footer>
            {cancel}
            <Button variant="destructive" size="sm" type="submit" isLoading={busy}>
              Turn Off 2FA
            </Button>
          </Footer>
        </form>
      )}

      {/* 2FA-01: password first, then the QR code and secret, then a 6-digit code. */}
      {step === "password" && (
        <form onSubmit={submitted(start)} className="space-y-4">
          {heading("Confirm Password to Begin Setup", "For security, please enter your current account password before generating your 2FA secret key.")}
          <Status error={error} />
          <Input label="Account Password" type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your current password" />
          <Footer>
            {cancel}
            <Button size="sm" type="submit" isLoading={busy}>
              Continue to QR Code
            </Button>
          </Footer>
        </form>
      )}

      {step === "qr" && (
        <form onSubmit={submitted(activate)} className="space-y-4">
          {heading("Scan QR Code in Authenticator App", "Open your authenticator app (Google Authenticator, Authy, 1Password) and scan the code below.")}
          <Status error={error} />
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            {setup.qr && (
              <div className="p-2 bg-white rounded-none border border-zinc-200 shadow-sm shrink-0">
                <img src={setup.qr} alt="2FA QR Code" className="w-36 h-36 block" />
              </div>
            )}
            <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 font-sans">Can't scan the QR code? Enter secret key manually:</div>
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all justify-between">
                <span className="truncate tracking-wider font-semibold">{setup.secret.match(/.{1,4}/g)?.join(" ") || setup.secret}</span>
                <IconButton
                  label={copiedSecret ? "Copied" : "Copy secret"}
                  size="sm"
                  onClick={() => copySecret(setup.secret)}
                  icon={copiedSecret ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">Type is Time-based (TOTP), 30-second interval, 6 digits.</p>
            </div>
          </div>
          <Input
            label="Enter 6-Digit Code from Authenticator"
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            helperText="2FA will only become active once you verify a valid code."
          />
          <Footer>
            {cancel}
            <Button size="sm" type="submit" isLoading={busy} disabled={code.trim().length !== 6}>
              Verify & Activate 2FA
            </Button>
          </Footer>
        </form>
      )}

      {/* 2FA-02: 10 single-use codes, shown once, copy or download as .txt. */}
      {step === "codes" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-success-600 dark:text-success-400 font-semibold font-sans text-sm">
            <ShieldCheck className="w-5 h-5 text-success-500" />
            <span>Two-Factor Authentication is Enabled!</span>
          </div>
          <Alert variant="warning" title="Save your 10 recovery codes now">
            If you lose access to your authenticator app, these codes are the only way to recover access. Each code is single-use and will{" "}
            <span className="underline font-semibold">never be shown again</span>.
          </Alert>
          <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
            {recoveryCodes.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-zinc-400 select-none text-[11px] font-sans">{i + 1}.</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-wider">{c}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCodes(recoveryText(email, recoveryCodes))}
              leftIcon={copiedCodes ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedCodes ? "Codes Copied!" : "Copy All Codes"}
            </Button>
            <Button variant="outline" size="sm" onClick={download} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Download (.txt)
            </Button>
          </div>
          <Footer>
            <Button size="sm" onClick={() => go("status")}>
              I've Saved My Recovery Codes
            </Button>
          </Footer>
        </div>
      )}
    </div>
  );
}
