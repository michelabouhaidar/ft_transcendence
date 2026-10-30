import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, LegalDocId, LegalLink, LEGAL_TITLES, Logo, ThemeToggle } from "../components";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

type Block = string | { intro?: string; items: string[] };

interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

interface LegalDoc {
  summary: string;
  sections: Section[];
}

const EFFECTIVE = "October 18, 2026";

const PRIVACY: LegalDoc = {
  summary:
    "Trenno only collects what it needs to run your team's workspace: your account details, the work you put into it, and a session cookie to keep you signed in. Nothing is sold, shared with advertisers or used to track you.",
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        "Trenno is a collaborative task manager built by a team of students as their ft_transcendence project at 42. It is an educational project, not a commercial service. In this policy, “we” means the Trenno project team, which runs this instance and is responsible for the data stored in it.",
        "This policy explains what information Trenno stores, why, who can see it, how long it is kept and what you can do about it.",
      ],
    },
    {
      id: "what-we-collect",
      title: "Information we collect",
      blocks: [
        {
          intro: "Information you give us:",
          items: [
            "Account details: your first name, last name, email address and password. Your password is never stored as typed; only a salted hash of it is kept.",
            "Profile details you choose to add: job title, a short bio and an avatar image (JPEG, PNG or WebP, up to 2 MB).",
            "Two-factor authentication: if you turn it on, the secret used by your authenticator app and your one-time recovery codes.",
            "Workspace content: organizations, projects, tasks (title, description, status, priority, due date, assignee), comments, friend requests and invitations you send, including the email address of the person you invite.",
          ],
        },
        {
          intro: "Information created while you use Trenno:",
          items: [
            "Your role in your organization (Org Admin, Member or Viewer) and which projects you can access.",
            "Your online or offline status and when you were last seen, while you have Trenno open.",
            "Notifications about activity that concerns you, and whether you have read them.",
            "The date your account, tasks and comments were created or changed, and the account status (active or suspended).",
          ],
        },
        "We do not collect payment details, your location, your contacts or any data from other websites.",
      ],
    },
    {
      id: "how-we-use",
      title: "How we use your information",
      blocks: [
        {
          items: [
            "To run the workspace: show your projects and tasks, assign work, and keep everyone's board up to date in real time.",
            "To send emails you need: email verification, password reset, invitations, and notices when your role changes, you are removed from an organization, or your account is suspended, reactivated or deleted.",
            "To keep accounts secure: sign-in, two-factor authentication, and signing an account out on every device when it is suspended or deleted.",
            "To show your friends whether you are online.",
          ],
        },
        "We do not use your information for advertising, profiling or analytics, and we do not sell, rent or trade it.",
      ],
    },
    {
      id: "who-can-see",
      title: "Who can see your information",
      blocks: [
        {
          items: [
            "Members of your organization can see your name, avatar, job title, bio, role and profile page.",
            "Projects, their tasks and comments are visible only to members who have been given access to that project.",
            "Only your friends can see whether you are online.",
            "Org Admins of your organization can change your role, give or remove project access, and remove you from the organization.",
            "System Administrators of this Trenno instance can see all accounts and organizations so they can run the platform, for example to suspend or delete an account.",
            "People outside your organization cannot see your workspace. People you invite only see the invitation: the organization's name and who invited them.",
          ],
        },
        "We do not share your information with third parties, except where the law requires it.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      blocks: [
        {
          items: [
            "One session cookie keeps you signed in. It is HTTP-only, so scripts on the page cannot read it, and it ends when you sign out.",
            "Your browser's local storage remembers two preferences on your device only: light or dark theme (trenno-theme) and whether you last used the board or list view (trenno-project-view).",
          ],
        },
        "Trenno uses no advertising, analytics or third-party tracking cookies.",
      ],
    },
    {
      id: "security",
      title: "How your information is protected",
      blocks: [
        "All traffic between your browser and Trenno is encrypted with HTTPS. Passwords are stored as salted hashes, sign-in can be protected with two-factor authentication, and every request is checked against your role before any data is returned.",
        "No system is perfectly secure. If we learn of a breach that affects your data, we will tell you by email.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep it, and deletion",
      blocks: [
        {
          items: [
            "Your account and profile are kept while your account exists.",
            "If you leave or are removed from an organization, you lose access to it and your assigned tasks become unassigned. Tasks and comments you wrote stay in the organization's projects.",
            "If an Org Admin deletes an organization, its projects and everything in them are deleted. Member accounts stay active.",
            "If your account is deleted, your name, email, avatar, bio, password and two-factor settings are erased and you are signed out everywhere. A notice is sent to your email first. Tasks and comments you wrote stay for your team, shown as written by “Deleted user”.",
            "Expired invitations stay visible to the organization's admins with the status “Expired”; the link no longer works after 7 days.",
          ],
        },
      ],
    },
    {
      id: "your-rights",
      title: "Your choices and rights",
      blocks: [
        {
          items: [
            "See and correct your details: edit your name, job title, bio and avatar in your account settings.",
            "Change your password or turn two-factor authentication on or off in your account settings.",
            "Remove your avatar, decline invitations, remove friends, or leave your organization at any time.",
            "Ask for a copy of your data or for your account to be deleted by contacting us (see below). Account deletion is carried out by a System Administrator.",
          ],
        },
        "If you live in the European Union, the GDPR gives you these rights of access, correction, erasure and objection, as well as the right to complain to your data protection authority.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: ["If we change this policy, we will update the date at the top of this page."],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        "For any question about your data, or to ask for a copy or deletion of it, contact the Trenno project team that runs this instance. If you belong to an organization, your Org Admin can also pass your request on.",
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  summary:
    "Use Trenno to organize your team's work, keep your account secure, respect the people you work with, and remember it is a student project offered as is.",
  sections: [
    {
      id: "acceptance",
      title: "About these terms",
      blocks: [
        "Trenno is a collaborative task manager built by a team of students as their ft_transcendence project at 42. These terms apply to everyone who uses this instance of Trenno. By creating an account or accepting an invitation you agree to them and to the Privacy Policy.",
        "If you do not agree, do not create an account or use Trenno.",
      ],
    },
    {
      id: "accounts",
      title: "Your account",
      blocks: [
        {
          items: [
            "Give your real name and an email address you can access. You must verify your email before you can sign in.",
            "Choose a strong password (at least 8 characters with upper- and lower-case letters, a number and a special character) and do not share it. Turning on two-factor authentication is recommended.",
            "One account is for one person. You are responsible for what is done with your account.",
            "Tell an administrator straight away if you think someone else has used your account.",
          ],
        },
      ],
    },
    {
      id: "organizations",
      title: "Organizations and roles",
      blocks: [
        "You can belong to one organization at a time. You join one by creating it or by accepting an invitation. Invitation links work once and expire after 7 days.",
        {
          intro: "What each role can do:",
          items: [
            "Viewer: see the projects they have access to, read tasks and comment.",
            "Member: everything a Viewer can, plus create, edit, move, assign and delete tasks.",
            "Org Admin: everything a Member can, plus create and manage projects and who can access them, invite people, change members' roles, remove members, and edit or delete the organization.",
            "System Administrator: runs this Trenno instance. Does not belong to an organization, but can manage all accounts and organizations.",
          ],
        },
        "An organization must always have at least one Org Admin. Org Admins are responsible for who they invite and what access they give.",
      ],
    },
    {
      id: "content",
      title: "Your content",
      blocks: [
        "You keep ownership of what you write in Trenno: tasks, descriptions, comments, your profile and avatar. You allow Trenno to store it and to show it to the people who have access to it under these roles.",
        "Work you add to an organization is part of that organization's workspace. If you leave or are removed, the tasks and comments you wrote stay so your team can continue its work. If the organization is deleted, its projects and their contents are deleted with it.",
        "Only upload content you have the right to share. Do not store passwords, payment details, health data or other sensitive personal information in tasks or comments.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        {
          intro: "When using Trenno you must not:",
          items: [
            "Harass, threaten or impersonate other people, or post hateful, illegal or sexually explicit content.",
            "Try to access accounts, organizations or projects you have not been given access to.",
            "Attack, overload, probe or scan the service, or try to bypass its security or role checks.",
            "Use Trenno to send spam or to collect other users' information.",
            "Upload malware or files meant to harm other users.",
          ],
        },
      ],
    },
    {
      id: "suspension",
      title: "Suspension, removal and deletion",
      blocks: [
        {
          items: [
            "An Org Admin can remove you from their organization or change your role. You are told by email.",
            "A System Administrator can suspend your account if these terms are broken. A suspended account is signed out on every device and cannot sign in until it is reactivated. You are told by email, with the reason if one is given.",
            "A System Administrator can delete an account, on your request or after a serious breach of these terms. What is erased and what is kept is described in the Privacy Policy.",
            "You can leave your organization at any time, and ask for your account to be deleted.",
          ],
        },
      ],
    },
    {
      id: "availability",
      title: "Availability and no warranty",
      blocks: [
        "Trenno is an educational project provided free of charge and “as is”. We work to keep it running and your data safe, but we do not guarantee that it will always be available, free of errors, or kept running after the project ends. The service may be interrupted, changed, reset or shut down.",
        "Keep your own copy of anything important. Do not rely on Trenno for critical or commercial work.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      blocks: [
        "As far as the law allows, the Trenno project team is not liable for any loss of data, work, profit or opportunity resulting from your use of Trenno or from it being unavailable.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: [
        "We may update these terms as Trenno changes. The date at the top of this page shows the latest version. If you keep using Trenno after a change, you accept the new terms.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: ["For any question about these terms, contact the Trenno project team that runs this instance, or your organization's Org Admin."],
    },
  ],
};

const DOCS: Record<LegalDocId, LegalDoc> = { privacy: PRIVACY, terms: TERMS };

// /privacy and /terms: public pages, readable signed in or out.
export function LegalPage({ doc: id }: { doc: LegalDocId }) {
  const { user } = useAuth();
  const { navigate } = useApp();
  const doc = DOCS[id];
  const title = LEGAL_TITLES[id];
  const other: LegalDocId = id === "privacy" ? "terms" : "privacy";

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Trenno`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  const goHome = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    navigate(user ? "/projects" : "/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-dark-bg dark:text-zinc-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-dark-border bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" onClick={goHome} aria-label="Trenno home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <Logo size="sm" />
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => goHome()}>
              {user ? "Back to workspace" : "Back to home"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Effective {EFFECTIVE}</p>

        <p className="mt-6 p-4 text-sm leading-relaxed border border-zinc-200 dark:border-dark-border bg-zinc-50 dark:bg-dark-card text-zinc-700 dark:text-zinc-300">
          {doc.summary}
        </p>

        <nav aria-label="On this page" className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">On this page</h2>
          <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-decimal list-inside text-zinc-600 dark:text-zinc-300">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-4">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
              <h2 id={`${s.id}-title`} className="text-lg sm:text-xl font-semibold text-zinc-950 dark:text-white">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm sm:text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {s.blocks.map((b, j) =>
                  typeof b === "string" ? (
                    <p key={j}>{b}</p>
                  ) : (
                    <div key={j}>
                      {b.intro && <p className="mb-2">{b.intro}</p>}
                      <ul className="list-disc pl-5 space-y-1.5 marker:text-zinc-400">
                        {b.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 pt-6 border-t border-zinc-200 dark:border-dark-border text-sm text-zinc-600 dark:text-zinc-400">
          See also the <LegalLink to={other} className="font-medium text-brand-600 dark:text-brand-400 underline" />.
        </p>
      </main>

      <footer className="border-t border-zinc-200 dark:border-dark-border py-6 px-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Trenno · ft_transcendence project at 42</span>
          <div className="flex items-center gap-4">
            <LegalLink to="privacy" />
            <span aria-hidden="true">&middot;</span>
            <LegalLink to="terms" />
          </div>
        </div>
      </footer>
    </div>
  );
}
