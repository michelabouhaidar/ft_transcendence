import React, { useState, useEffect, useRef } from "react";
import { User, Organization, authApi } from "../api/auth";
import { usersApi } from "../api/users";
import {
  Modal,
  Input,
  Button,
  Avatar,
  Badge,
  Tabs,
  PasswordChecklist,
  PasswordMatchIndicator,
  Alert,
  Textarea,
  IconButton,
} from "./index";
import {
  User as UserIcon,
  KeyRound,
  Lock,
  Unlock,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Camera,
  Trash2,
} from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  organization: Organization | null;
  role: "SA" | "OA" | "MEMBER" | "VIEWER" | "U" | null;
  onUserUpdated?: (updated: User) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  organization,
  role,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState("profile");

  // Avatar upload state (USR-02)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA state
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [remainingRecoveryCodes, setRemainingRecoveryCodes] = useState<number>(0);
  const [isLoading2fa, setIsLoading2fa] = useState(false);

  // 2FA Setup flow state: "idle" | "password" | "qr" | "codes"
  const [setupStep, setSetupStep] = useState<"idle" | "password" | "qr" | "codes">("idle");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupQrCode, setSetupQrCode] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // 2FA Disable state
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isSubmittingDisable, setIsSubmittingDisable] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableSuccess, setDisableSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setJobTitle(user.jobTitle || "");
      setBio(user.bio || "");
    }
    setProfileSuccess(null);
    setProfileError(null);
    setPasswordSuccess(null);
    setPasswordError(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [user, isOpen]);

  const fetch2faStatus = async () => {
    setIsLoading2fa(true);
    try {
      const res = await authApi.get2faStatus();
      setIs2faEnabled(res.enabled);
      setRemainingRecoveryCodes(res.remainingRecoveryCodes ?? 0);
    } catch {
      setIs2faEnabled(false);
      setRemainingRecoveryCodes(0);
    } finally {
      setIsLoading2fa(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch2faStatus();
      setSetupStep("idle");
      setSetupPassword("");
      setSetupSecret("");
      setSetupQrCode("");
      setSetupCode("");
      setSetupError(null);
      setIsDisabling(false);
      setDisablePassword("");
      setDisableCode("");
      setDisableError(null);
      setDisableSuccess(null);
    }
  }, [isOpen]);

  const handleStartSetup = () => {
    setSetupStep("password");
    setSetupPassword("");
    setSetupError(null);
    setDisableSuccess(null);
  };

  const handleGenerateSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupPassword) {
      setSetupError("Password is required to initiate 2FA setup.");
      return;
    }
    setIsSettingUp(true);
    setSetupError(null);
    try {
      const res = await authApi.setup2fa({ password: setupPassword });
      setSetupSecret(res.secret);
      setSetupQrCode(res.qrCodeDataUrl);
      setSetupStep("qr");
      setSetupPassword("");
    } catch (err: any) {
      setSetupError(err.message || "Failed to initiate 2FA setup.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleActivate2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = setupCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setSetupError("Please enter a valid 6-digit verification code.");
      return;
    }
    setIsSettingUp(true);
    setSetupError(null);
    try {
      const res = await authApi.enable2fa({ code: cleanCode });
      setRecoveryCodes(res.recoveryCodes || []);
      setSetupStep("codes");
      setIs2faEnabled(true);
      fetch2faStatus();
    } catch (err: any) {
      setSetupError(err.message || "Invalid verification code. Please check your authenticator app.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleFinishSetup = () => {
    setSetupStep("idle");
    setSetupSecret("");
    setSetupQrCode("");
    setSetupCode("");
    setRecoveryCodes([]);
  };

  const handleCopySecret = () => {
    if (!setupSecret) return;
    navigator.clipboard.writeText(setupSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text =
      `TRENNO TWO-FACTOR AUTHENTICATION RECOVERY CODES\n` +
      `Account: ${user?.email || "User"}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nNotice: Each code can only be used once. Keep these codes in a safe place.`;
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text =
      `TRENNO TWO-FACTOR AUTHENTICATION RECOVERY CODES\n` +
      `Account: ${user?.email || "User"}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nNotice: Each code can only be used once. Keep these codes in a safe place.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trenno-2fa-recovery-codes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword || !disableCode.trim()) {
      setDisableError("Both current password and verification code are required.");
      return;
    }
    setIsSubmittingDisable(true);
    setDisableError(null);
    try {
      await authApi.disable2fa({
        password: disablePassword,
        code: disableCode.trim(),
      });
      setIs2faEnabled(false);
      setIsDisabling(false);
      setDisablePassword("");
      setDisableCode("");
      setDisableSuccess("Two-factor authentication has been disabled. A confirmation email was sent to your inbox.");
      fetch2faStatus();
    } catch (err: any) {
      setDisableError(err.message || "Failed to disable 2FA.");
    } finally {
      setIsSubmittingDisable(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("First name and last name are required.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: jobTitle.trim() || null,
        bio: bio.trim() || null,
      });
      setProfileSuccess("Profile updated successfully.");
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setAvatarError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("The image must be 2 MB or smaller.");
      return;
    }
    setIsAvatarBusy(true);
    try {
      const { avatarPath } = await usersApi.uploadAvatar(file);
      onUserUpdated?.({ ...user, avatarPath });
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload the image.");
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setAvatarError(null);
    setIsAvatarBusy(true);
    try {
      await usersApi.removeAvatar();
      onUserUpdated?.({ ...user, avatarPath: null });
    } catch (err: any) {
      setAvatarError(err.message || "Failed to remove the image.");
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully. Other sessions have been revoked.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  };


  const roleBadgeVariant =
    role === "SA" ? "sa" : role === "OA" ? "oa" : role === "VIEWER" ? "warning" : "member";


  const tabs = [
    { id: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
    { id: "security", label: "Password", icon: <KeyRound className="w-4 h-4" /> },
    { id: "2fa", label: "2FA Security", icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* User Monogram Header */}
        <div className="flex items-center gap-4 p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-dark-card">
          <Avatar
            size="lg"
            name={user ? `${user.firstName} ${user.lastName}` : "User"}
            src={user?.avatarPath || undefined}
            colorSeed={user?.id}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-base text-zinc-950 dark:text-white font-sans truncate">
                {user?.firstName} {user?.lastName}
              </span>
              {role && role !== "U" && (
                <Badge variant={roleBadgeVariant} size="sm">
                  {role === "OA" ? "ORG ADMIN" : role === "SA" ? "PLATFORM ADMIN" : role || "MEMBER"}
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-0.5 truncate">
              {user?.email}
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">
                {organization ? organization.name : "No Workspace Assigned"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarPicked} />
              <Button
                variant="outline"
                size="sm"
                type="button"
                isLoading={isAvatarBusy}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.avatarPath ? "Change photo" : "Upload photo"}
              </Button>
              {user?.avatarPath && (
                <Button variant="ghost" size="sm" type="button" disabled={isAvatarBusy} leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleAvatarRemove}>
                  Remove
                </Button>
              )}
              <span className="text-[11px] text-zinc-400">JPEG, PNG or WebP, up to 2 MB</span>
            </div>
            {avatarError && (
              <Alert appearance="inline" variant="error" className="mt-2">
                {avatarError}
              </Alert>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* ========================================================= */}
        {/* TAB 1: PROFILE                                            */}
        {/* ========================================================= */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1">
            {profileSuccess && (
              <Alert appearance="inline" variant="success">
                {profileSuccess}
              </Alert>
            )}
            {profileError && (
              <Alert appearance="inline" variant="error">
                {profileError}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={50}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={50}
              />
            </div>

            <Input
              label="Email Address"
              value={user?.email || ""}
              disabled
              helperText="Email address cannot be changed."
            />

            <Input
              label="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Lead Frontend Engineer"
              maxLength={100}
            />

            <Textarea
              label="Bio / Status Note"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of your role or responsibilities..."
              rows={3}
              maxLength={500}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-dark-border">
              <Button variant="outline" size="sm" onClick={onClose} type="button">
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isUpdatingProfile}
              >
                Save Profile
              </Button>
            </div>
          </form>
        )}


        {/* ========================================================= */}
        {/* TAB 3: PASSWORD (AUTH-06)                                 */}
        {/* ========================================================= */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
            {passwordSuccess && (
              <Alert appearance="inline" variant="success">
                {passwordSuccess}
              </Alert>
            )}
            {passwordError && (
              <Alert appearance="inline" variant="error">
                {passwordError}
              </Alert>
            )}

            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter your current password"
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new secure password"
            />

            <PasswordChecklist password={newPassword} />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
            />

            <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-dark-border">
              <Button variant="outline" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isChangingPassword}
              >
                Change Password
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TWO-FACTOR AUTH (2FA-01, 2FA-02, 2FA-04)           */}
        {/* ========================================================= */}
        {activeTab === "2fa" && (
          <div className="space-y-5 pt-1">
            {isLoading2fa ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-sans">
                Loading two-factor authentication status...
              </div>
            ) : (
              <>
            {/* Success message banner (e.g. after disabling 2FA) */}
            {disableSuccess && (
              <Alert appearance="inline" variant="success">
                {disableSuccess}
              </Alert>
            )}

            {/* CASE 1: 2FA is currently ENABLED (and not currently displaying just-generated recovery codes) */}
            {is2faEnabled && setupStep !== "codes" && (
              <div>
                {!isDisabling ? (
                  <div className="space-y-5">
                    {/* Status header card */}
                    <div className="p-4 border border-success-500/20 bg-success-50/50 dark:bg-success-950/20 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-success-500/10 text-success-600 dark:text-success-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-sans">
                              Two-Factor Authentication is Active
                            </span>
                            <Badge variant="success" size="sm">
                              ENABLED
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans mt-0.5">
                            Your account is protected by TOTP authenticator security.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Security Details & Recovery Codes Count */}
                    <div className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-dark-card space-y-3">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-zinc-600 dark:text-zinc-400">Emergency Recovery Codes:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {remainingRecoveryCodes} code{remainingRecoveryCodes === 1 ? "" : "s"} remaining
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
                        Single-use recovery codes permit emergency sign-in if your authenticator device is lost.
                        Each used code is permanently invalidated.
                      </p>
                    </div>

                    {/* Disable Action Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDisabling(true);
                          setDisableError(null);
                          setDisableSuccess(null);
                        }}
                        className="text-destructive-600 dark:text-destructive-400 hover:border-destructive-400"
                        leftIcon={<Unlock className="w-3.5 h-3.5" />}
                      >
                        Disable 2FA
                      </Button>

                      <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Form to Disable 2FA (2FA-04: Password + valid code. Confirmation email.) */
                  <form onSubmit={handleDisableSubmit} className="space-y-4">
                    <Alert variant="warning" icon={<ShieldAlert className="w-4 h-4" />} title="Disable Two-Factor Authentication">
                      Disabling 2FA lowers your account defense. A confirmation notice will be emailed to your inbox upon deactivation.
                    </Alert>

                    {disableError && (
              <Alert appearance="inline" variant="error">
                {disableError}
              </Alert>
            )}

                    <Input
                      label="Confirm Account Password"
                      type="password"
                      required
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your current password"
                    />

                    <Input
                      label="Current 6-Digit Code or Recovery Code"
                      type="text"
                      required
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      placeholder="e.g. 123456 or ABCD-1234"
                      autoComplete="one-time-code"
                      helperText="Enter the 6-digit code from your authenticator app or one of your remaining emergency recovery codes."
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setIsDisabling(false);
                          setDisablePassword("");
                          setDisableCode("");
                          setDisableError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        isLoading={isSubmittingDisable}
                        className="bg-destructive-600 hover:bg-destructive-700 text-white border-transparent"
                      >
                        Turn Off 2FA
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* CASE 2: 2FA Setup Flow or Recovery Codes Display */}
            {(!is2faEnabled || setupStep === "codes") && (
              <div>
                {/* Step 0: Idle Overview */}
                {setupStep === "idle" && (
                  <div className="space-y-5">
                    <div className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-dark-card flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-sm text-zinc-950 dark:text-white font-sans">
                          <Lock className="w-4 h-4 text-brand-600" />
                          <span>Two-Factor Authentication (TOTP)</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans mt-1">
                          Protect your account by requiring an authenticator code during login.
                        </p>
                      </div>

                      <Badge variant="warning" size="md">
                        DISABLED
                      </Badge>
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed space-y-2">
                      <p>
                        Two-Factor Authentication prevents unauthorized access even if your password becomes compromised.
                        You will need a time-based one-time password (TOTP) from an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, or 1Password) each time you log in.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                        10 single-use recovery codes will also be generated to ensure you never lose access to your account.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartSetup}
                        leftIcon={<ShieldCheck className="w-4 h-4" />}
                      >
                        Enable Two-Factor Authentication
                      </Button>

                      <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 1: Password Required (2FA-01) */}
                {setupStep === "password" && (
                  <form onSubmit={handleGenerateSetup} className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                        Confirm Password to Begin Setup
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                        For security, please enter your current account password before generating your 2FA secret key.
                      </p>
                    </div>

                    {setupError && (
              <Alert appearance="inline" variant="error">
                {setupError}
              </Alert>
            )}

                    <Input
                      label="Account Password"
                      type="password"
                      required
                      autoFocus
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />

                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setSetupStep("idle");
                          setSetupPassword("");
                          setSetupError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        isLoading={isSettingUp}
                      >
                        Continue to QR Code
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 2: QR Code & Secret as text + 6-digit code (2FA-01) */}
                {setupStep === "qr" && (
                  <form onSubmit={handleActivate2fa} className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                        Scan QR Code in Authenticator App
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                        Open your authenticator app (Google Authenticator, Authy, 1Password) and scan the code below.
                      </p>
                    </div>

                    {setupError && (
              <Alert appearance="inline" variant="error">
                {setupError}
              </Alert>
            )}

                    {/* Local QR Code */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                      {setupQrCode && (
                        <div className="p-2 bg-white rounded-none border border-zinc-200 shadow-sm shrink-0">
                          <img
                            src={setupQrCode}
                            alt="2FA QR Code"
                            className="w-36 h-36 block"
                          />
                        </div>
                      )}

                      <div className="space-y-2.5 flex-1 min-w-0 text-center sm:text-left">
                        <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 font-sans">
                          Can't scan the QR code? Enter secret key manually:
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all justify-between">
                          <span className="truncate tracking-wider font-semibold">
                            {setupSecret.match(/.{1,4}/g)?.join(" ") || setupSecret}
                          </span>
<IconButton
                            label={copiedSecret ? "Copied" : "Copy secret"}
                            size="sm"
                            onClick={handleCopySecret}
                            icon={copiedSecret ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">
                          Type is Time-based (TOTP), 30-second interval, 6 digits.
                        </p>
                      </div>
                    </div>

                    {/* 6-digit confirmation code input */}
                    <div>
                      <Input
                        label="Enter 6-Digit Code from Authenticator"
                        type="text"
                        required
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={setupCode}
                        onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                        helperText="2FA will only become active once you verify a valid code."
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setSetupStep("idle");
                          setSetupCode("");
                          setSetupSecret("");
                          setSetupQrCode("");
                          setSetupError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        isLoading={isSettingUp}
                        disabled={setupCode.trim().length !== 6}
                      >
                        Verify & Activate 2FA
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 3: Recovery Codes (2FA-02: 10 single-use codes, shown once, copy / download .txt) */}
                {setupStep === "codes" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-success-600 dark:text-success-400 font-semibold font-sans text-sm">
                      <ShieldCheck className="w-5 h-5 text-success-500" />
                      <span>Two-Factor Authentication is Enabled!</span>
                    </div>

                    <Alert variant="warning" title="Save your 10 recovery codes now">
                      If you lose access to your authenticator app, these codes are the only way to recover access.
                      Each code is single-use and will <span className="underline font-semibold">never be shown again</span>.
                    </Alert>

                    {/* 10 codes in 2-column grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
                      {recoveryCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60"
                        >
                          <span className="text-zinc-400 select-none text-[11px] font-sans">
                            {idx + 1}.
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-wider">
                            {code}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions: Copy & Download */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyRecoveryCodes}
                        leftIcon={
                          copiedCodes ? (
                            <Check className="w-3.5 h-3.5 text-success-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {copiedCodes ? "Codes Copied!" : "Copy All Codes"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadRecoveryCodes}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download (.txt)
                      </Button>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-dark-border">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleFinishSetup}
                      >
                        I've Saved My Recovery Codes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
