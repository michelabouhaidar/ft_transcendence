import { MouseEvent, ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { Checkbox } from "./Checkbox";

export type LegalDocId = "privacy" | "terms";

export const LEGAL_TITLES: Record<LegalDocId, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

interface LegalLinkProps {
  to: LegalDocId;
  /** Open in a new tab, so a half-filled form stays where it is. */
  newTab?: boolean;
  className?: string;
  children?: ReactNode;
}

// A real link to /privacy or /terms. In the same tab it navigates inside the app without a reload.
export function LegalLink({ to, newTab = false, className = "", children }: LegalLinkProps) {
  const { navigate } = useApp();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // inside a checkbox label: don't toggle the box
    if (newTab || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(`/${to}`);
  };
  return (
    <a
      href={`/${to}`}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      {children ?? LEGAL_TITLES[to]}
    </a>
  );
}

// "I agree to the Terms of Service and Privacy Policy." The links open the pages in a new tab.
export function TermsCheckbox({ checked, onChange, className }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  const link = "font-medium text-brand-600 dark:text-brand-400 underline";
  return (
    <Checkbox
      className={className}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      required
      label={
        <>
          I agree to the <LegalLink to="terms" newTab className={link} /> and <LegalLink to="privacy" newTab className={link} />.
        </>
      }
    />
  );
}
