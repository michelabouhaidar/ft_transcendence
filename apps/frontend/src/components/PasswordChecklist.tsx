import { Check, X } from "lucide-react";

function Rule({ ok, label, failClass = "text-zinc-400 dark:text-zinc-500" }: { ok: boolean; label: string; failClass?: string }) {
  const Icon = ok ? Check : X;
  return (
    <div className={`flex items-center gap-1.5 transition-colors ${ok ? "text-success-600 dark:text-success-400 font-medium" : failClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
      <span>{label}</span>
    </div>
  );
}

export function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="mt-2 text-xs font-sans">
      <div className="text-zinc-500 dark:text-zinc-400 font-medium mb-1.5">Password requirements:</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((r) => (
          <Rule key={r.label} {...r} />
        ))}
      </div>
    </div>
  );
}

export function PasswordMatchIndicator({ password, confirmPassword }: { password: string; confirmPassword: string }) {
  if (!confirmPassword) return null;
  const ok = password.length > 0 && password === confirmPassword;
  return (
    <div className="mt-2 text-xs font-sans">
      <Rule ok={ok} label={ok ? "Passwords match" : "Passwords do not match"} failClass="text-destructive-600 dark:text-destructive-400 font-medium" />
    </div>
  );
}
