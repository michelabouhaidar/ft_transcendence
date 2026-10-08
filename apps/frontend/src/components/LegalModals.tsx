import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ArrowLeft } from "lucide-react";

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      description="How we collect, protect, and handle your information."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
        {/* Policy Header Banner */}
        <div className="p-3.5 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-zinc-950 dark:text-white font-sans text-xs">
              Privacy & Data Protection
            </span>
            <span className="text-[11px] text-zinc-400 font-sans">
              Last Updated: September 2026
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            We are committed to protecting your privacy and ensuring you have complete control over your personal and workspace information.
          </p>
        </div>

        {/* Section 1 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            1. Information We Collect
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            We collect the basic details you provide when creating an account, including your name, email address, and workspace content such as projects, tasks, and team discussions.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            2. How We Use Your Information
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Your information is used strictly to operate your workspace, enable team collaboration, maintain account security, and send essential notifications regarding your account.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            3. Data Ownership & Sharing
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You retain full ownership of all content created in your workspace. We never sell, rent, or trade your personal information or workspace data to third parties.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            4. Your Rights & Data Deletion
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You can access, update, export, or permanently delete your account and associated workspace data at any time through your account settings or by contacting our support team.
          </p>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-dark-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const TermsModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Service"
      description="Terms and guidelines for using the platform and workspaces."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
        {/* Policy Header Banner */}
        <div className="p-3.5 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-zinc-950 dark:text-white font-sans text-xs">
              Platform Terms of Service
            </span>
            <span className="text-[11px] text-zinc-400 font-sans">
              Effective: September 2026
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            By creating an account or using Trenno, you agree to these standard terms of service.
          </p>
        </div>

        {/* Section 1 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            1. User Agreement
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            By using Trenno, you agree to these terms. If you are using the service on behalf of a company or organization, you confirm that you have the authority to accept these terms on their behalf.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            2. Account Responsibility
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You are responsible for safeguarding your login credentials and for all activities that occur under your account. Please notify us immediately if you suspect unauthorized access.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            3. Team Collaboration & Roles
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Organization administrators manage member invitations, permissions, and workspace projects. Members agree to collaborate respectfully and in accordance with team rules.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            4. Acceptable Use
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You agree to use Trenno only for lawful purposes. You must not attempt to disrupt services, access other users' private accounts, or misuse collaborative workspaces.
          </p>
        </div>

        {/* Section 5 */}
        <div className="p-3 border border-zinc-200 dark:border-dark-border bg-zinc-50/50 dark:bg-dark-card space-y-1.5">
          <h4 className="font-semibold text-zinc-950 dark:text-white font-sans text-xs sm:text-sm">
            5. Service Availability
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            We work continuously to provide reliable and uninterrupted service to support your team's workflow and productivity.
          </p>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-dark-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
        </div>
      </div>
    </Modal>
  );
};
