import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Clock, Lock, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { authApi, LoginResponse } from "../api/auth";
import type { ApiError } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { PasswordChecklist, PasswordMatchIndicator } from "./PasswordChecklist";
import { TermsCheckbox, useLegalModals } from "./LegalModals";
import { Spinner } from "./Spinner";

export type AuthPopupView = "login" | "signup" | "verify" | "forgot-password" | "reset-password";

export interface SignedIn {
  role: string;
  isSystemAdmin: boolean;
  hasOrg: boolean;
}

interface ViewProps {
  onClose: () => void;
  onSwitchView: (view: AuthPopupView) => void;
}

// One dialog for /login, /signup, /verify, /forgot-password and /reset-password. Each view mounts
// fresh when the route changes, so no state leaks between them.
export function AuthPopup({ view, onSignedIn, ...props }: ViewProps & { view: AuthPopupView | null; onSignedIn: (info: SignedIn) => void }) {
  switch (view) {
    case "login":
      return <LoginView {...props} onSignedIn={onSignedIn} />;
    case "signup":
      return <SignupView {...props} />;
    case "verify":
      return <VerifyView {...props} />;
    case "forgot-password":
      return <ForgotView {...props} />;
    case "reset-password":
      return <ResetView {...props} />;
    default:
      return null;
  }
}

// ---------- Shared pieces ----------

const token = () => new URLSearchParams(window.location.search).get("token");

function AuthModal({ title, description, wide, onClose, children }: { title: string; description: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Modal isOpen onClose={onClose} title={title} description={description} maxWidth={wide ? "lg" : "md"}>
      {children}
    </Modal>
  );
}

// Error code + message, a busy flag, and a submit handler that records API errors.
function useAuthForm() {
  const [error, setError] = useState<{ code: string | null; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fail = (code: string | null, message: string) => setError({ code, message });
  const submit = (action: () => Promise<unknown>, fallback: string, fallbackCode: string | null = null) => async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      const ex = err as ApiError;
      fail(ex.code || fallbackCode, ex.message || fallback);
    } finally {
      setBusy(false);
    }
  };
  return { error, setError, fail, busy, submit };
}

function Footer({ children, onBack, roomy }: { children?: ReactNode; onBack?: () => void; roomy?: boolean }) {
  return (
    <div className={`${roomy ? "mt-5 pt-4" : "mt-4 pt-3"} border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between`}>
      {children}
      {onBack && (
        <Button variant="quiet" size="sm" onClick={onBack}>
          Back
        </Button>
      )}
    </div>
  );
}

const TONES = {
  brand: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
  success: "bg-success-500/10 text-success-600 dark:text-success-400",
  danger: "bg-destructive-500/10 text-destructive-600 dark:text-destructive-400",
};

// Centered outcome: icon, heading, text and actions.
function Result({ tone, icon, title, children, actions }: { tone: keyof typeof TONES; icon: ReactNode; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="text-center py-4 space-y-4">
      <div className={`mx-auto w-12 h-12 flex items-center justify-center ${TONES[tone]}`}>{icon}</div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">{title}</h3>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">{children}</div>
      </div>
      <div className="pt-2 space-y-3">{actions}</div>
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="py-8 text-center space-y-3">
      <Spinner size="lg" className="mx-auto" />
      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{text}</p>
    </div>
  );
}

const ToSignIn = ({ onSwitchView, label = "Proceed to Sign In", arrow = true }: { onSwitchView: ViewProps["onSwitchView"]; label?: string; arrow?: boolean }) => (
  <Button fullWidth onClick={() => onSwitchView("login")} rightIcon={arrow ? <ArrowRight className="w-4 h-4" /> : undefined}>
    {label}
  </Button>
);

const PasswordPair = ({ password, confirm, setPassword, setConfirm, labels }: { password: string; confirm: string; setPassword: (v: string) => void; setConfirm: (v: string) => void; labels: [string, string] }) => (
  <>
    <div>
      <Input label={labels[0]} type="password" required placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      <PasswordChecklist password={password} />
    </div>
    <div>
      <Input label={labels[1]} type="password" required placeholder="••••••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <PasswordMatchIndicator password={password} confirmPassword={confirm} />
    </div>
  </>
);

// ---------- Login and 2FA ----------

function LoginView({ onClose, onSwitchView, onSignedIn }: ViewProps & { onSignedIn: (info: SignedIn) => void }) {
  const { setAuthData } = useAuth();
  const { error, setError, fail, busy, submit } = useAuthForm();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [code, setCode] = useState("");
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [resend, setResend] = useState<{ busy: boolean; status: string | null }>({ busy: false, status: null });

  const finish = (res: LoginResponse) => {
    if (!res.user) return;
    const role = res.role || (res.user.isSystemAdmin ? "SA" : "U");
    setAuthData(res.user, res.organization || null, role);
    onSignedIn({ role, isSystemAdmin: Boolean(res.user.isSystemAdmin || role === "SA"), hasOrg: Boolean(res.organization) });
  };

  const login = submit(async () => {
    if (!email.trim()) return fail("VALIDATION_ERROR", "Please enter your email address to continue.");
    if (!password) return fail("VALIDATION_ERROR", "Please enter your account password to continue.");
    const res = await authApi.login({ email: email.trim(), password });
    if (res.requires2fa) setRequires2fa(true);
    else finish(res);
  }, "Unable to sign in. Please verify your credentials.");

  const verify2fa = submit(
    async () => {
      if (!code.trim()) return fail("VALIDATION_ERROR", isRecoveryCode ? "Please enter your emergency recovery code." : "Please enter the 6-digit authentication code.");
      finish(await authApi.login2fa({ code: code.trim(), isRecoveryCode }));
    },
    "Invalid authentication code.",
    "INVALID_2FA_CODE"
  );

  const resendVerification = async () => {
    if (!email.trim()) return setResend({ busy: false, status: "Please enter your email address above first." });
    setResend({ busy: true, status: null });
    try {
      await authApi.resendVerification(email.trim());
      setResend({ busy: false, status: "A fresh verification link has been sent to your email!" });
    } catch (err) {
      setResend({ busy: false, status: (err as Error).message || "Failed to resend verification link." });
    }
  };

  // Leaves the 2FA step, or switches between authenticator and recovery code.
  const reset2fa = (next: { requires2fa?: boolean; isRecoveryCode?: boolean }) => {
    if (next.requires2fa !== undefined) setRequires2fa(next.requires2fa);
    if (next.isRecoveryCode !== undefined) setIsRecoveryCode(next.isRecoveryCode);
    setCode("");
    setError(null);
  };

  const forgotLink = (label: string) => (
    <Button variant="link" size="sm" onClick={() => onSwitchView("forgot-password")}>
      {label}
    </Button>
  );

  // Diagnostic messages for the sign-in step, by error code.
  const loginAlert = () => {
    if (!error) return null;
    const inline = (props: { variant: "error" | "warning"; title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) => (
      <Alert appearance="inline" className="mb-4" {...props} />
    );
    switch (error.code) {
      case "EMAIL_NOT_VERIFIED":
        return inline({
          variant: "warning",
          icon: <Mail className="w-4 h-4" />,
          title: "Verify your email first",
          action: (
            <div className="flex items-center gap-2">
              <Button variant="link" size="sm" onClick={resendVerification} isLoading={resend.busy} leftIcon={<Mail className="w-3.5 h-3.5" />}>
                {resend.busy ? "Sending verification email..." : "Resend verification email"}
              </Button>
              {resend.status && <span className="text-[11px] text-success-600 dark:text-success-400 font-medium">{resend.status}</span>}
            </div>
          ),
          children: "Your account is pending verification. Please click the confirmation link sent to your inbox.",
        });
      case "ACCOUNT_LOCKED":
        return inline({
          variant: "error",
          icon: <Lock className="w-4 h-4" />,
          title: "Account temporarily locked",
          action: forgotLink("Reset your password"),
          children: `${error.message} For security, 5 consecutive failed sign-in attempts lock the account for 15 minutes.`,
        });
      case "ACCOUNT_SUSPENDED":
        return inline({
          variant: "error",
          icon: <ShieldAlert className="w-4 h-4" />,
          title: "Account suspended",
          children: "Your account has been suspended by an administrator. Please contact your administrator or support.",
        });
      case "RATE_LIMITED":
        return inline({ variant: "warning", icon: <Clock className="w-4 h-4" />, title: "Too many attempts", children: error.message });
      case "INVALID_CREDENTIALS":
        return inline({ variant: "error", title: "Invalid email or password", action: forgotLink("Forgot your password?"), children: "Please check your credentials and try again." });
      default:
        return inline({ variant: "error", children: error.message });
    }
  };

  if (requires2fa) {
    return (
      <AuthModal
        onClose={onClose}
        title={isRecoveryCode ? "Emergency Recovery" : "Two-Factor Verification"}
        description={isRecoveryCode ? "Enter an emergency recovery code to access your account" : "Enter the 6-digit code from your authenticator app"}
      >
        <div className="space-y-4">
          {error?.code === "EXPIRED_SESSION" ? (
            <Alert
              appearance="inline"
              variant="warning"
              icon={<Clock className="w-4 h-4" />}
              title="Verification session expired"
              action={
                <Button variant="link" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => reset2fa({ requires2fa: false })}>
                  Return to sign in
                </Button>
              }
            >
              Your temporary session has expired. Please sign in with your email and password again.
            </Alert>
          ) : (
            error && (
              <Alert
                appearance="inline"
                variant="error"
                action={
                  !isRecoveryCode && (
                    <Button variant="link" size="sm" onClick={() => reset2fa({ isRecoveryCode: true })}>
                      Lost your device? Use an emergency recovery code
                    </Button>
                  )
                }
              >
                {error.message}
              </Alert>
            )
          )}

          <form onSubmit={verify2fa} className="space-y-4">
            <Input
              label={isRecoveryCode ? "Emergency Recovery Code" : "Authenticator Code"}
              inputMode={isRecoveryCode ? "text" : "numeric"}
              autoFocus
              required
              placeholder={isRecoveryCode ? "ABCD-1234" : "123456"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center tracking-widest font-sans font-semibold tabular-nums text-lg"
            />
            <Button type="submit" fullWidth isLoading={busy}>
              Verify Code
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 text-center text-xs">
            <Button variant="link" size="sm" onClick={() => reset2fa({ isRecoveryCode: !isRecoveryCode })}>
              {isRecoveryCode ? "Use 6-digit authenticator code instead" : "Lost your device? Use a recovery code"}
            </Button>
            <Button variant="quiet" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => reset2fa({ requires2fa: false })}>
              Back to email & password
            </Button>
          </div>
        </div>
      </AuthModal>
    );
  }

  return (
    <AuthModal onClose={onClose} title="Sign In" description="Access your workspace and projects">
      {loginAlert()}
      <form onSubmit={login} className="space-y-4">
        <Input label="Email address" type="email" name="email" autoComplete="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          labelAction={forgotLink("Forgot password?")}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth isLoading={busy} className="mt-2">
          Sign In to Workspace
        </Button>
      </form>
      <Footer onBack={onClose} roomy>
        <span>
          Don't have an account?{" "}
          <Button variant="link" size="sm" className="font-bold" onClick={() => onSwitchView("signup")}>
            Sign up
          </Button>
        </span>
      </Footer>
    </AuthModal>
  );
}

// ---------- Sign-up ----------

function SignupView({ onClose, onSwitchView }: ViewProps) {
  const { error, fail, busy, submit } = useAuthForm();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [done, setDone] = useState(false);

  const signup = submit(async () => {
    const { firstName, lastName, email } = form;
    if (!firstName.trim() || !lastName.trim()) return fail("VALIDATION_ERROR", "Please enter both your first name and last name.");
    if (!email.trim()) return fail("VALIDATION_ERROR", "Please enter a valid email address.");
    if (password !== confirm) return fail("PASSWORD_MISMATCH", "Passwords do not match. Please ensure both fields are identical.");
    if (!acceptTerms) return fail("TERMS_REQUIRED", "You must accept the Terms of Service and Privacy Policy to register.");
    await authApi.signup({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, passwordConfirmation: confirm, acceptTerms: true });
    setDone(true);
  }, "Failed to register. Please check your information.");

  if (done) {
    return (
      <AuthModal onClose={onClose} title="Check Your Inbox" description="We sent a verification link to your email">
        <Result tone="brand" icon={<Mail className="w-6 h-6" />} title="Verification link sent" actions={<ToSignIn onSwitchView={onSwitchView} />}>
          We've sent an activation link to <strong className="font-semibold text-zinc-950 dark:text-white">{form.email}</strong>. Click the link in your email to activate your
          account.
        </Result>
      </AuthModal>
    );
  }

  const text = (key: keyof typeof form) => ({ value: form[key], onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <AuthModal onClose={onClose} title="Create Account" description="Start organizing sprints and collaborating with your team" wide>
      {error && (
        <Alert appearance="inline" variant="error" title={error.code === "PASSWORD_MISMATCH" ? "Password mismatch" : "Registration failed"} className="mb-4">
          {error.message}
        </Alert>
      )}
      <form onSubmit={signup} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="First Name" required placeholder="Alex" {...text("firstName")} />
          <Input label="Last Name" required placeholder="Rivera" {...text("lastName")} />
        </div>
        <Input label="Email address" type="email" required placeholder="name@company.com" {...text("email")} />
        <PasswordPair password={password} confirm={confirm} setPassword={setPassword} setConfirm={setConfirm} labels={["Password", "Confirm Password"]} />
        <TermsCheckbox className="pt-1" checked={acceptTerms} onChange={setAcceptTerms} />
        <Button type="submit" fullWidth isLoading={busy} className="mt-2">
          Create Free Account
        </Button>
      </form>
      <Footer onBack={onClose}>
        <span>
          Already registered?{" "}
          <Button variant="link" size="sm" className="font-bold" onClick={() => onSwitchView("login")}>
            Sign in
          </Button>
        </span>
      </Footer>
    </AuthModal>
  );
}

// ---------- Email verification ----------

function VerifyView({ onClose, onSwitchView }: ViewProps) {
  const { error, fail, busy, submit } = useAuthForm();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const legal = useLegalModals();

  useEffect(() => {
    const t = token();
    if (!t) return onSwitchView("login");
    let live = true;
    authApi
      .verifyEmail(t)
      .then(() => live && setStatus("success"))
      .catch((err: ApiError) => {
        if (!live) return;
        setStatus("error");
        fail(err.code || null, err.message || "The verification link is invalid or has expired.");
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = submit(async () => {
    setSent(null);
    if (!email.trim()) return fail("VALIDATION_ERROR", "Please enter your email address.");
    setSent((await authApi.resendVerification(email.trim())).message);
  }, "Failed to resend verification link.");

  const titles = {
    loading: ["Email Verification", "Confirming your email address for Trenno"],
    success: ["Email Verified", "Your account is active and ready to use"],
    error: ["Verification Link Expired", "Request a fresh verification link for your account"],
  };

  return (
    <AuthModal onClose={onClose} title={titles[status][0]} description={titles[status][1]}>
      {status === "loading" && <Waiting text="Confirming your email verification token..." />}

      {status === "success" && (
        <>
          <Result tone="success" icon={<ShieldCheck className="w-6 h-6" />} title="Email Confirmed Successfully" actions={<ToSignIn onSwitchView={onSwitchView} />}>
            Your account is now fully active. You can sign in to access your organization and projects.
          </Result>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-200 dark:border-zinc-700/80 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold font-sans">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>Workspace Security & Legal Terms</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal font-sans">Your workspace account adheres to encrypted data protection and service terms:</p>
            <div className="flex items-center gap-3 pt-0.5 text-[11px]">
              <Button variant="link" size="sm" className="underline" onClick={legal.openTerms}>
                Terms of Service
              </Button>
              <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
              <Button variant="link" size="sm" className="underline" onClick={legal.openPrivacy}>
                Privacy Policy
              </Button>
            </div>
          </div>
          {legal.modals}
        </>
      )}

      {status === "error" && (
        <div className="space-y-4 text-left">
          <Alert appearance="inline" variant="error" title="Verification link expired or invalid">
            {error?.message || "The link is invalid or has expired. Enter your email below to receive a new verification link."}
          </Alert>
          {sent && (
            <Alert appearance="inline" variant="success" icon={<ShieldCheck className="w-4 h-4" />}>
              {sent}
            </Alert>
          )}
          <form onSubmit={resend} className="space-y-3">
            <Input label="Your email address" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" fullWidth isLoading={busy} leftIcon={<Mail className="w-4 h-4" />}>
              Resend Verification Email
            </Button>
          </form>
          <Footer onBack={onClose}>
            <Button variant="link" size="sm" className="font-bold" onClick={() => onSwitchView("login")}>
              Back to Sign In
            </Button>
          </Footer>
        </div>
      )}
    </AuthModal>
  );
}

// ---------- Forgot password ----------

function ForgotView({ onClose, onSwitchView }: ViewProps) {
  const { error, fail, busy, submit } = useAuthForm();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const send = submit(async () => {
    if (!email.trim()) return fail("VALIDATION_ERROR", "Please enter your account email address.");
    await authApi.forgotPassword(email.trim());
    setSent(true);
  }, "Failed to request password reset.");

  return (
    <AuthModal
      onClose={onClose}
      title={sent ? "Check Your Inbox" : "Reset Password"}
      description={sent ? "We've sent recovery instructions to your email" : "We'll send recovery instructions to your email"}
    >
      {sent ? (
        <Result
          tone="brand"
          icon={<Mail className="w-6 h-6" />}
          title="Check your email"
          actions={
            <>
              <ToSignIn onSwitchView={onSwitchView} label="Return to Sign In" arrow={false} />
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Send to a different email address
              </Button>
            </>
          }
        >
          <p>
            If an account is associated with <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>, we've sent password reset instructions.
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">The reset link will expire in 30 minutes. Please check your spam folder if it doesn't arrive.</p>
        </Result>
      ) : (
        <div className="space-y-4">
          {error && (
            <Alert appearance="inline" variant="error">
              {error.message}
            </Alert>
          )}
          <form onSubmit={send} className="space-y-4">
            <Input label="Account Email" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" fullWidth isLoading={busy}>
              Send Reset Link
            </Button>
          </form>
          <Footer onBack={onClose}>
            <Button variant="link" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} className="font-bold" onClick={() => onSwitchView("login")}>
              Back to sign in
            </Button>
          </Footer>
        </div>
      )}
    </AuthModal>
  );
}

// ---------- Reset password ----------

function ResetView({ onClose, onSwitchView }: ViewProps) {
  const { error, fail, busy, submit } = useAuthForm();
  const [link, setLink] = useState<{ status: "validating" | "valid" | "invalid"; token?: string; error?: string }>({ status: "validating" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = token();
    if (!t) return setLink({ status: "invalid", error: "Missing password reset token in link. Please request a new password reset link." });
    let live = true;
    authApi
      .verifyResetToken(t)
      .then(() => live && setLink({ status: "valid", token: t }))
      .catch((err: Error) => live && setLink({ status: "invalid", error: err.message || "Password reset link is invalid or has already been used." }));
    return () => {
      live = false;
    };
  }, []);

  const reset = submit(async () => {
    if (!link.token) return fail("INVALID_TOKEN", "Missing or invalid reset token. Please request a new link.");
    if (password !== confirm) return fail("PASSWORD_MISMATCH", "Passwords do not match. Please ensure both fields are identical.");
    await authApi.resetPassword({ token: link.token, password, passwordConfirmation: confirm });
    setDone(true);
  }, "Failed to reset password. The link may have expired.");

  const [title, description] = done
    ? ["Password Updated", "Your password has been changed successfully"]
    : link.status === "invalid"
    ? ["Invalid Reset Link", "This link cannot be used to reset your password"]
    : ["Set New Password", "Create a secure new password for your account"];

  return (
    <AuthModal onClose={onClose} title={title} description={description}>
      {link.status === "validating" ? (
        <Waiting text="Verifying password reset security link..." />
      ) : link.status === "invalid" ? (
        <Result
          tone="danger"
          icon={<AlertCircle className="w-6 h-6" />}
          title="Reset Link Invalid or Expired"
          actions={
            <>
              <Button fullWidth onClick={() => onSwitchView("forgot-password")}>
                Request New Reset Link
              </Button>
              <div className="pt-1">
                <Button variant="quiet" size="sm" onClick={() => onSwitchView("login")}>
                  Return to Sign In
                </Button>
              </div>
            </>
          }
        >
          {link.error ||
            "This password reset link is invalid or has already been used. For your security, reset links can only be used once and expire after 30 minutes."}
        </Result>
      ) : done ? (
        <Result
          tone="success"
          icon={<ShieldCheck className="w-6 h-6" />}
          title="Password Changed Successfully"
          actions={<ToSignIn onSwitchView={onSwitchView} label="Sign In With New Password" />}
        >
          Your password has been changed. All other active sessions were revoked for security.
        </Result>
      ) : (
        <>
          {error && (
            <Alert appearance="inline" variant="error" className="mb-4">
              {error.message}
            </Alert>
          )}
          <form onSubmit={reset} className="space-y-3.5">
            <PasswordPair password={password} confirm={confirm} setPassword={setPassword} setConfirm={setConfirm} labels={["New Password", "Confirm New Password"]} />
            <Button type="submit" fullWidth isLoading={busy} disabled={!link.token}>
              Reset Password
            </Button>
          </form>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs">
            <Button variant="link" size="sm" className="font-bold" onClick={() => onSwitchView("login")}>
              Return to Sign In
            </Button>
          </div>
        </>
      )}
    </AuthModal>
  );
}
