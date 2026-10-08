import React, { useState, useEffect } from "react";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { Spinner } from "./Spinner";
import { Checkbox } from "./Checkbox";
import { PasswordChecklist, PasswordMatchIndicator } from "./PasswordChecklist";
import { PrivacyModal, TermsModal } from "./LegalModals";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  AlertCircle,
  Mail,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export type AuthPopupView =
  | "login"
  | "signup"
  | "verify"
  | "forgot-password"
  | "reset-password";

interface AuthPopupProps {
  view: AuthPopupView | null;
  onClose: () => void;
  onSwitchView: (view: AuthPopupView) => void;
  onNavigateToOnboarding: (userData?: { role?: string; isSystemAdmin?: boolean; hasOrg?: boolean }) => void;
}

export const AuthPopup: React.FC<AuthPopupProps> = ({
  view,
  onClose,
  onSwitchView,
  onNavigateToOnboarding,
}) => {
  const { setAuthData } = useAuth();

  // -------------------------------------------------------------
  // Common error & loading state
  // -------------------------------------------------------------
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Login State
  // -------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // -------------------------------------------------------------
  // Sign-Up State
  // -------------------------------------------------------------
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // -------------------------------------------------------------
  // Verify State
  // -------------------------------------------------------------
  const [verifyStatus, setVerifyStatus] = useState<"loading" | "success" | "error" | "prompt">("loading");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Forgot Password State
  // -------------------------------------------------------------
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // -------------------------------------------------------------
  // Reset Password State
  // -------------------------------------------------------------
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetTokenStatus, setResetTokenStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [resetTokenError, setResetTokenError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Legal Modals State
  // -------------------------------------------------------------
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Reset errors and stale form states when view changes
  useEffect(() => {
    setErrorMessage(null);
    setErrorCode(null);
    setResendStatus(null);
    setResendMsg(null);
    setIsResending(false);
    setSignupSuccess(false);
    setForgotSuccess(false);
    setResetSuccess(false);
    setResetTokenStatus("idle");
    setResetTokenError(null);
    setRequires2fa(false);
    setTotpCode("");
    setIsRecoveryCode(false);
  }, [view]);

  // Handle URL query parameters for verify and reset-password
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (view === "verify") {
      if (token) {
        let isMounted = true;
        setVerifyStatus("loading");
        authApi
          .verifyEmail(token)
          .then(() => {
            if (isMounted) setVerifyStatus("success");
          })
          .catch((err) => {
            if (isMounted) {
              setVerifyStatus("error");
              setErrorCode(err.code || null);
              setErrorMessage(err.message || "The verification link is invalid or has expired.");
            }
          });
        return () => {
          isMounted = false;
        };
      } else {
        onSwitchView("login");
      }
    } else if (view === "reset-password") {
      if (token) {
        let isMounted = true;
        setResetTokenStatus("validating");
        setResetTokenError(null);
        authApi
          .verifyResetToken(token)
          .then(() => {
            if (isMounted) {
              setResetToken(token);
              setResetTokenStatus("valid");
            }
          })
          .catch((err) => {
            if (isMounted) {
              setResetTokenStatus("invalid");
              setResetTokenError(err.message || "Password reset link is invalid or has already been used.");
            }
          });
        return () => {
          isMounted = false;
        };
      } else {
        setResetTokenStatus("invalid");
        setResetTokenError("Missing password reset token in link. Please request a new password reset link.");
      }
    }
  }, [view, onSwitchView]);

  if (!view) return null;

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter your email address to continue.");
      return;
    }

    if (!loginPassword) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter your account password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: trimmedEmail,
        password: loginPassword,
      });

      if (res.requires2fa) {
        setRequires2fa(true);
      } else if (res.user) {
        const userRole = res.role || (res.user.isSystemAdmin ? "SA" : "U");
        const isSA = Boolean(res.user.isSystemAdmin || userRole === "SA");
        const hasOrg = Boolean(res.organization);

        setAuthData(res.user, res.organization || null, userRole);
        onNavigateToOnboarding({
          role: userRole,
          isSystemAdmin: isSA,
          hasOrg,
        });
      }
    } catch (err: any) {
      setErrorCode(err.code || null);
      setErrorMessage(err.message || "Unable to sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    if (!totpCode.trim()) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage(
        isRecoveryCode
          ? "Please enter your emergency recovery code."
          : "Please enter the 6-digit authentication code."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login2fa({
        code: totpCode.trim(),
        isRecoveryCode,
      });
      if (res.user) {
        const userRole = res.role || (res.user.isSystemAdmin ? "SA" : "U");
        const isSA = Boolean(res.user.isSystemAdmin || userRole === "SA");
        const hasOrg = Boolean(res.organization);

        setAuthData(res.user, res.organization || null, userRole);
        onNavigateToOnboarding({
          role: userRole,
          isSystemAdmin: isSA,
          hasOrg,
        });
      }
    } catch (err: any) {
      setErrorCode(err.code || "INVALID_2FA_CODE");
      setErrorMessage(err.message || "Invalid authentication code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendUnverified = async () => {
    const targetEmail = loginEmail.trim();
    if (!targetEmail) {
      setResendStatus("Please enter your email address above first.");
      return;
    }

    try {
      setIsResending(true);
      setResendStatus(null);
      await authApi.resendVerification(targetEmail);
      setResendStatus("A fresh verification link has been sent to your email!");
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    if (!signupFirstName.trim() || !signupLastName.trim()) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter both your first name and last name.");
      return;
    }

    if (!signupEmail.trim()) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setErrorCode("PASSWORD_MISMATCH");
      setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    if (!acceptTerms) {
      setErrorCode("TERMS_REQUIRED");
      setErrorMessage("You must accept the Terms of Service and Privacy Policy to register.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.signup({
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        passwordConfirmation: signupPasswordConfirm,
        acceptTerms: true,
      });
      setSignupSuccess(true);
    } catch (err: any) {
      setErrorCode(err.code || null);
      setErrorMessage(err.message || "Failed to register. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    if (!forgotEmail.trim()) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter your account email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      setErrorCode(err.code || null);
      setErrorMessage(err.message || "Failed to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    if (!resetToken) {
      setErrorCode("INVALID_TOKEN");
      setErrorMessage("Missing or invalid reset token. Please request a new link.");
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setErrorCode("PASSWORD_MISMATCH");
      setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        token: resetToken,
        password: resetPassword,
        passwordConfirmation: resetPasswordConfirm,
      });
      setResetSuccess(true);
    } catch (err: any) {
      setErrorCode(err.code || null);
      setErrorMessage(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendFromVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);
    setResendMsg(null);

    if (!resendEmail.trim()) {
      setErrorCode("VALIDATION_ERROR");
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      setResendMsg(res.message);
    } catch (err: any) {
      setErrorCode(err.code || null);
      setErrorMessage(err.message || "Failed to resend verification link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Diagnostic Status Renderers for Login & 2FA (Frameless / No Cadre)
  // -------------------------------------------------------------
  const renderLoginAlert = () => {
    if (!errorMessage) return null;

    if (errorCode === "EMAIL_NOT_VERIFIED") {
      return (
        <Alert
          appearance="inline"
          variant="warning"
          icon={<Mail className="w-4 h-4" />}
          title="Verify your email first"
          className="mb-4"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                size="sm"
                onClick={handleResendUnverified}
                isLoading={isResending}
                leftIcon={<Mail className="w-3.5 h-3.5" />}
              >
                {isResending ? "Sending verification email..." : "Resend verification email"}
              </Button>
              {resendStatus && (
                <span className="text-[11px] text-success-600 dark:text-success-400 font-medium">{resendStatus}</span>
              )}
            </div>
          }
        >
          Your account is pending verification. Please click the confirmation link sent to your inbox.
        </Alert>
      );
    }

    if (errorCode === "ACCOUNT_LOCKED") {
      return (
        <Alert
          appearance="inline"
          variant="error"
          icon={<Lock className="w-4 h-4" />}
          title="Account temporarily locked"
          className="mb-4"
          action={
            <Button variant="link" size="sm" onClick={() => onSwitchView("forgot-password")}>
              Reset your password
            </Button>
          }
        >
          {errorMessage} For security, 5 consecutive failed sign-in attempts lock the account for 15 minutes.
        </Alert>
      );
    }

    if (errorCode === "ACCOUNT_SUSPENDED") {
      return (
        <Alert appearance="inline" variant="error" icon={<ShieldAlert className="w-4 h-4" />} title="Account suspended" className="mb-4">
          Your account has been suspended by an administrator. Please contact your administrator or support.
        </Alert>
      );
    }

    if (errorCode === "RATE_LIMITED") {
      return (
        <Alert appearance="inline" variant="warning" icon={<Clock className="w-4 h-4" />} title="Too many attempts" className="mb-4">
          {errorMessage}
        </Alert>
      );
    }

    if (errorCode === "INVALID_CREDENTIALS") {
      return (
        <Alert
          appearance="inline"
          variant="error"
          title="Invalid email or password"
          className="mb-4"
          action={
            <Button variant="link" size="sm" onClick={() => onSwitchView("forgot-password")}>
              Forgot your password?
            </Button>
          }
        >
          Please check your credentials and try again.
        </Alert>
      );
    }

    return (
      <Alert appearance="inline" variant="error" className="mb-4">
        {errorMessage}
      </Alert>
    );
  };

  const render2faAlert = () => {
    if (!errorMessage) return null;

    if (errorCode === "EXPIRED_SESSION") {
      return (
        <Alert
          appearance="inline"
          variant="warning"
          icon={<Clock className="w-4 h-4" />}
          title="Verification session expired"
          action={
            <Button
              variant="link"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => {
                setRequires2fa(false);
                setTotpCode("");
                setErrorMessage(null);
                setErrorCode(null);
              }}
            >
              Return to sign in
            </Button>
          }
        >
          Your temporary session has expired. Please sign in with your email and password again.
        </Alert>
      );
    }

    return (
      <Alert
        appearance="inline"
        variant="error"
        action={
          !isRecoveryCode && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setIsRecoveryCode(true);
                setTotpCode("");
                setErrorMessage(null);
                setErrorCode(null);
              }}
            >
              Lost your device? Use an emergency recovery code
            </Button>
          )
        }
      >
        {errorMessage}
      </Alert>
    );
  };

  // Titles & Descriptions for the Modal Header
  const modalConfigs = {
    login: {
      title: requires2fa
        ? (isRecoveryCode ? "Emergency Recovery" : "Two-Factor Verification")
        : "Sign In",
      description: requires2fa
        ? (isRecoveryCode
            ? "Enter an emergency recovery code to access your account"
            : "Enter the 6-digit code from your authenticator app")
        : "Access your workspace and projects",
      maxWidth: "md" as const,
    },
    signup: {
      title: signupSuccess ? "Check Your Inbox" : "Create Account",
      description: signupSuccess
        ? "We sent a verification link to your email"
        : "Start organizing sprints and collaborating with your team",
      maxWidth: signupSuccess ? ("md" as const) : ("lg" as const),
    },
    verify: {
      title:
        verifyStatus === "success"
          ? "Email Verified"
          : verifyStatus === "error"
            ? "Verification Link Expired"
            : "Email Verification",
      description:
        verifyStatus === "success"
          ? "Your account is active and ready to use"
          : verifyStatus === "error"
            ? "Request a fresh verification link for your account"
            : "Confirming your email address for Trenno",
      maxWidth: "md" as const,
    },
    "forgot-password": {
      title: forgotSuccess ? "Check Your Inbox" : "Reset Password",
      description: forgotSuccess
        ? "We've sent recovery instructions to your email"
        : "We'll send recovery instructions to your email",
      maxWidth: "md" as const,
    },
    "reset-password": {
      title: resetSuccess
        ? "Password Updated"
        : resetTokenStatus === "invalid"
          ? "Invalid Reset Link"
          : "Set New Password",
      description: resetSuccess
        ? "Your password has been changed successfully"
        : resetTokenStatus === "invalid"
          ? "This link cannot be used to reset your password"
          : "Create a secure new password for your account",
      maxWidth: "md" as const,
    },
  };

  const currentConfig = modalConfigs[view];

  return (
    <>
      <Modal
        isOpen={view !== null}
        onClose={onClose}
        title={currentConfig.title}
        description={currentConfig.description}
        maxWidth={currentConfig.maxWidth}
      >
        {/* ------------------------------------------------------- */}
        {/* VIEW: LOGIN                                             */}
        {/* ------------------------------------------------------- */}
        {view === "login" && (
          <div>
            {!requires2fa ? (
              <>
                {renderLoginAlert()}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <Input
                      id="popup-login-email"
                      label="Email address"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <Input
                    id="popup-login-password"
                    label="Password"
                    labelAction={
                      <Button variant="link" size="sm" onClick={() => onSwitchView("forgot-password")}>
                        Forgot password?
                      </Button>
                    }
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                    className="mt-2"
                  >
                    Sign In to Workspace
                  </Button>
                </form>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="font-bold"
                      onClick={() => onSwitchView("signup")}
                    >
                      Sign up
                    </Button>
                  </span>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={onClose}
                  >
                    Back
                  </Button>
                </div>
              </>
            ) : (
              /* 2FA view */
              <div className="space-y-4">
                {render2faAlert()}

                <form onSubmit={handle2faSubmit} className="space-y-4">
                  <div>
                    <Input
                      id="popup-2fa-code"
                      label={isRecoveryCode ? "Emergency Recovery Code" : "Authenticator Code"}
                      type="text"
                      inputMode={isRecoveryCode ? "text" : "numeric"}
                      autoFocus
                      required
                      placeholder={isRecoveryCode ? "ABCD-1234" : "123456"}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="w-full text-center tracking-widest font-sans font-semibold tabular-nums text-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    Verify Code
                  </Button>
                </form>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 text-center text-xs">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setIsRecoveryCode(!isRecoveryCode);
                      setTotpCode("");
                      setErrorMessage(null);
                      setErrorCode(null);
                    }}
                  >
                    {isRecoveryCode
                      ? "Use 6-digit authenticator code instead"
                      : "Lost your device? Use a recovery code"}
                  </Button>

                  <Button
                    variant="quiet"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setRequires2fa(false);
                      setTotpCode("");
                      setErrorMessage(null);
                      setErrorCode(null);
                    }}
                  >
                    Back to email & password
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* VIEW: SIGNUP                                            */}
        {/* ------------------------------------------------------- */}
        {view === "signup" && (
          <div>
            {!signupSuccess ? (
              <>
                {errorMessage && (
                  <Alert
                    appearance="inline"
                    variant="error"
                    title={errorCode === "PASSWORD_MISMATCH" ? "Password mismatch" : "Registration failed"}
                    className="mb-4"
                  >
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Input
                      id="popup-signup-fn"
                      label="First Name"
                        type="text"
                        required
                        placeholder="Alex"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                      id="popup-signup-ln"
                      label="Last Name"
                        type="text"
                        required
                        placeholder="Rivera"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      id="popup-signup-email"
                      label="Email address"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      id="popup-signup-pass"
                      label="Password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <PasswordChecklist password={signupPassword} />
                  </div>

                  <div>
                    <Input
                      id="popup-signup-confirm"
                      label="Confirm Password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    />
                    <PasswordMatchIndicator
                      password={signupPassword}
                      confirmPassword={signupPasswordConfirm}
                    />
                  </div>

                  <Checkbox
                    className="pt-1"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    label={
                      <>
                        I agree to the{" "}
                        <Button
                          variant="link"
                          size="sm"
                          className="underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTermsOpen(true);
                          }}
                        >
                          Terms of Service
                        </Button>{" "}
                        and{" "}
                        <Button
                          variant="link"
                          size="sm"
                          className="underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPrivacyOpen(true);
                          }}
                        >
                          Privacy Policy
                        </Button>
                        .
                      </>
                    }
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                    className="mt-2"
                  >
                    Create Free Account
                  </Button>
                </form>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>
                    Already registered?{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="font-bold"
                      onClick={() => onSwitchView("login")}
                    >
                      Sign in
                    </Button>
                  </span>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={onClose}
                  >
                    Back
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Verification link sent
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                    We've sent an activation link to <strong className="font-semibold text-zinc-950 dark:text-white">{signupEmail}</strong>. Click the link in your email to activate your account.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onSwitchView("login")}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Sign In
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* VIEW: VERIFY                                            */}
        {/* ------------------------------------------------------- */}
        {view === "verify" && (
          <div>
            {verifyStatus === "loading" && (
              <div className="py-8 text-center space-y-3">
                <Spinner size="lg" className="mx-auto" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Confirming your email verification token...
                </p>
              </div>
            )}

            {verifyStatus === "success" && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 bg-success-500/10 text-success-600 dark:text-success-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Email Confirmed Successfully
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                    Your account is now fully active. You can sign in to access your organization and projects.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onSwitchView("login")}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Sign In
                  </Button>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border border-zinc-200 dark:border-zinc-700/80 text-left text-xs space-y-1.5 mt-4">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold font-sans">
                    <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>Workspace Security & Legal Terms</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                    Your workspace account adheres to encrypted data protection and service terms:
                  </p>
                  <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                    <Button
                      variant="link"
                      size="sm"
                      className="underline"
                      onClick={() => setTermsOpen(true)}
                    >
                      Terms of Service
                    </Button>
                    <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="underline"
                      onClick={() => setPrivacyOpen(true)}
                    >
                      Privacy Policy
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(verifyStatus === "error" || verifyStatus === "prompt") && (
              <div className="space-y-4 text-left">
                <Alert appearance="inline" variant="error" title="Verification link expired or invalid">
                  {errorMessage || "The link is invalid or has expired. Enter your email below to receive a new verification link."}
                </Alert>

                {resendMsg && (
                  <Alert appearance="inline" variant="success" icon={<ShieldCheck className="w-4 h-4" />}>
                    {resendMsg}
                  </Alert>
                )}

                <form onSubmit={handleResendFromVerify} className="space-y-3">
                  <div>
                    <Input
                      id="popup-verify-email"
                      label="Your email address"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    Resend Verification Email
                  </Button>
                </form>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs flex items-center justify-between">
                  <Button
                    variant="link"
                    size="sm"
                    className="font-bold"
                    onClick={() => onSwitchView("login")}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={onClose}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* VIEW: FORGOT PASSWORD                                   */}
        {/* ------------------------------------------------------- */}
        {view === "forgot-password" && (
          <div>
            {!forgotSuccess ? (
              <div className="space-y-4">
                {errorMessage && (
                  <Alert appearance="inline" variant="error">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <Input
                      id="popup-forgot-email"
                      label="Account Email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    Send Reset Link
                  </Button>
                </form>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <Button
                    variant="link"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    className="font-bold"
                    onClick={() => onSwitchView("login")}
                  >
                    Back to sign in
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={onClose}
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Check your email
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                    If an account is associated with <span className="font-semibold text-zinc-900 dark:text-zinc-100">{forgotEmail}</span>, we've sent password reset instructions.
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans pt-1">
                    The reset link will expire in 30 minutes. Please check your spam folder if it doesn't arrive.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onSwitchView("login")}
                  >
                    Return to Sign In
                  </Button>

                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setForgotSuccess(false);
                      setForgotEmail("");
                    }}
                  >
                    Send to a different email address
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* VIEW: RESET PASSWORD                                    */}
        {/* ------------------------------------------------------- */}
        {view === "reset-password" && (
          <div>
            {resetTokenStatus === "validating" ? (
              <div className="py-8 text-center space-y-3">
                <Spinner size="lg" className="mx-auto" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Verifying password reset security link...
                </p>
              </div>
            ) : resetTokenStatus === "invalid" ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 bg-destructive-500/10 text-destructive-600 dark:text-destructive-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Reset Link Invalid or Expired
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                    {resetTokenError || "This password reset link is invalid or has already been used. For your security, reset links can only be used once and expire after 30 minutes."}
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onSwitchView("forgot-password")}
                  >
                    Request New Reset Link
                  </Button>

                  <div className="pt-1">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => onSwitchView("login")}
                    >
                      Return to Sign In
                    </Button>
                  </div>
                </div>
              </div>
            ) : !resetSuccess ? (
              <>
                {errorMessage && (
                  <Alert appearance="inline" variant="error" className="mb-4">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  <div>
                    <Input
                      id="popup-reset-pass"
                      label="New Password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    <PasswordChecklist password={resetPassword} />
                  </div>

                  <div>
                    <Input
                      id="popup-reset-confirm"
                      label="Confirm New Password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={resetPasswordConfirm}
                      onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    />
                    <PasswordMatchIndicator
                      password={resetPassword}
                      confirmPassword={resetPasswordConfirm}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={isSubmitting}
                    disabled={!resetToken}
                  >
                    Reset Password
                  </Button>
                </form>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs">
                  <Button
                    variant="link"
                    size="sm"
                    className="font-bold"
                    onClick={() => onSwitchView("login")}
                  >
                    Return to Sign In
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-12 h-12 bg-success-500/10 text-success-600 dark:text-success-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Password Changed Successfully
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
                    Your password has been changed. All other active sessions were revoked for security.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => onSwitchView("login")}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In With New Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Privacy & Terms Modals */}
      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </>
  );
};
