import React from "react";
import { Check, X } from "lucide-react";

interface PasswordChecklistProps {
  password: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => {
  const criteria = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 text-xs font-sans transition-all">
      <div className="text-zinc-500 dark:text-zinc-400 font-medium mb-1.5">Password requirements:</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              item.valid ? "text-success-600 dark:text-success-400 font-medium" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {item.valid ? (
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export const PasswordMatchIndicator: React.FC<PasswordMatchIndicatorProps> = ({
  password,
  confirmPassword,
}) => {
  if (!confirmPassword) return null;

  const isMatching = password.length > 0 && password === confirmPassword;

  return (
    <div
      className={`mt-2 text-xs font-sans transition-all flex items-center gap-1.5 ${
        isMatching
          ? "text-success-600 dark:text-success-400 font-medium"
          : "text-destructive-600 dark:text-destructive-400 font-medium"
      }`}
    >
      {isMatching ? (
        <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
      ) : (
        <X className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
      )}
      <span>
        {isMatching ? "Passwords match" : "Passwords do not match"}
      </span>
    </div>
  );
};
