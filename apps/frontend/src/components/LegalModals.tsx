import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";

interface LegalDoc {
  title: string;
  description: string;
  heading: string;
  date: string;
  intro: string;
  sections: Array<[title: string, text: string]>;
}

const PRIVACY: LegalDoc = {
  title: "Privacy Policy",
  description: "How we collect, protect, and handle your information.",
  heading: "Privacy & Data Protection",
  date: "Last Updated: September 2026",
  intro: "We are committed to protecting your privacy and ensuring you have complete control over your personal and workspace information.",
  sections: [
    ["Information We Collect", "We collect the basic details you provide when creating an account, including your name, email address, and workspace content such as projects, tasks, and team discussions."],
    ["How We Use Your Information", "Your information is used strictly to operate your workspace, enable team collaboration, maintain account security, and send essential notifications regarding your account."],
    ["Data Ownership & Sharing", "You retain full ownership of all content created in your workspace. We never sell, rent, or trade your personal information or workspace data to third parties."],
    ["Your Rights & Data Deletion", "You can access, update, export, or permanently delete your account and associated workspace data at any time through your account settings or by contacting our support team."],
  ],
};

const TERMS: LegalDoc = {
  title: "Terms of Service",
  description: "Terms and guidelines for using the platform and workspaces.",
  heading: "Platform Terms of Service",
  date: "Effective: September 2026",
  intro: "By creating an account or using Trenno, you agree to these standard terms of service.",
  sections: [
    ["User Agreement", "By using Trenno, you agree to these terms. If you are using the service on behalf of a company or organization, you confirm that you have the authority to accept these terms on their behalf."],
    ["Account Responsibility", "You are responsible for safeguarding your login credentials and for all activities that occur under your account. Please notify us immediately if you suspect unauthorized access."],
    ["Team Collaboration & Roles", "Organization administrators manage member invitations, permissions, and workspace projects. Members agree to collaborate respectfully and in accordance with team rules."],
    ["Acceptable Use", "You agree to use Trenno only for lawful purposes. You must not attempt to disrupt services, access other users' private accounts, or misuse collaborative workspaces."],
    ["Service Availability", "We work continuously to provide reliable and uninterrupted service to support your team's workflow and productivity."],
  ],
};

const box = "border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card";

function LegalModal({ doc, isOpen, onClose }: { doc: LegalDoc; isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={doc.title} description={doc.description} maxWidth="lg">
      <div className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
        <div className={`p-3.5 space-y-1 ${box}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-zinc-950 dark:text-white text-xs">{doc.heading}</span>
            <span className="text-[11px] text-zinc-400">{doc.date}</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{doc.intro}</p>
        </div>
        {doc.sections.map(([title, text], i) => (
          <div key={title} className={`p-3 space-y-1.5 ${box}`}>
            <h4 className="font-semibold text-zinc-950 dark:text-white text-xs sm:text-sm">
              {i + 1}. {title}
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{text}</p>
          </div>
        ))}
        <div className="pt-3 border-t border-zinc-200 dark:border-dark-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const PrivacyModal = (props: { isOpen: boolean; onClose: () => void }) => <LegalModal doc={PRIVACY} {...props} />;
export const TermsModal = (props: { isOpen: boolean; onClose: () => void }) => <LegalModal doc={TERMS} {...props} />;

// Open buttons anywhere; render `modals` once.
export function useLegalModals() {
  const [open, setOpen] = useState<"privacy" | "terms" | null>(null);
  const close = () => setOpen(null);
  return {
    openPrivacy: () => setOpen("privacy"),
    openTerms: () => setOpen("terms"),
    modals: (
      <>
        <PrivacyModal isOpen={open === "privacy"} onClose={close} />
        <TermsModal isOpen={open === "terms"} onClose={close} />
      </>
    ),
  };
}

// "I agree to the Terms of Service and Privacy Policy." with links that open the texts.
export function TermsCheckbox({ checked, onChange, className }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  const legal = useLegalModals();
  const link = (label: string, open: () => void) => (
    <Button
      variant="link"
      size="sm"
      className="underline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open();
      }}
    >
      {label}
    </Button>
  );
  return (
    <>
      <Checkbox
        className={className}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        label={
          <>
            I agree to the {link("Terms of Service", legal.openTerms)} and {link("Privacy Policy", legal.openPrivacy)}.
          </>
        }
      />
      {legal.modals}
    </>
  );
}
