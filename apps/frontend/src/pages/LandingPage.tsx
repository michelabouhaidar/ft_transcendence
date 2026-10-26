import { ReactNode } from "react";
import { ArrowRight, Flag, FolderKanban, ListTodo, LogOut } from "lucide-react";
import { Avatar, Badge, Button, Card, LegalLink, Logo, ThemeToggle} from "../components";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

const FEATURES: Array<{ icon: typeof Flag; title: string; text: string; preview: ReactNode }> = [
  {
    icon: FolderKanban,
    title: "Visual Kanban & Agile Workflows",
    text: "Move work forward with customizable visual stages. Drag tasks smoothly between columns, configure custom workflows, and give your team an instant bird's-eye view of every project.",
    preview: (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { variant: "todo" as const, label: "To Do", task: "Sprint Design", box: "bg-zinc-50 dark:bg-dark-elevated border-zinc-200 dark:border-dark-border" },
          { variant: "in_progress" as const, label: "In Progress", task: "Task Sync", box: "bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/60" },
        ].map((c) => (
          <div key={c.label} className={`rounded-none p-2.5 border ${c.box}`}>
            <div className="mb-1">
              <Badge variant={c.variant}>{c.label}</Badge>
            </div>
            <div className="font-semibold text-zinc-900 dark:text-white truncate text-xs font-sans">{c.task}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Flag,
    title: "Smart Priorities & Deadlines",
    text: "Focus on high-impact initiatives. Highlight critical blockers with clear priority tiers, countdown due dates, and automated reminders before deadlines slip.",
    preview: (
      <div className="space-y-2 text-xs">
        {[
          { variant: "urgent" as const, label: "Urgent", due: "2h remaining", box: "bg-destructive-50 dark:bg-destructive-950/20 border-destructive-500/20" },
          { variant: "high" as const, label: "High", due: "Tomorrow", box: "bg-warning-50 dark:bg-warning-950/20 border-warning-500/20" },
        ].map((p) => (
          <div key={p.label} className={`flex items-center justify-between rounded-none px-3 py-1.5 border ${p.box}`}>
            <Badge variant={p.variant}>{p.label}</Badge>
            <span className="text-[10px] font-sans font-medium text-zinc-500">{p.due}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ListTodo,
    title: "Actionable Subtasks & Checklists",
    text: "Turn ambitious initiatives into clear, manageable steps. Track granular checklist progress with dynamic completion bars as your team finishes each item.",
    preview: (
      <>
        <div className="flex justify-between text-xs font-semibold mb-1.5 font-sans">
          <span className="text-zinc-500">Checklist Progress</span>
          <span className="text-brand-600 tabular-nums">75% (3/4)</span>
        </div>
        <div className="h-2 w-full rounded-none bg-zinc-100 dark:bg-dark-elevated overflow-hidden">
          <div className="h-full bg-brand-600 rounded-none w-3/4" />
        </div>
      </>
    ),
  },
];

const STEPS = [
  { title: "Create Workspace", text: "Set up your team's space, organize projects, and set your workflows in seconds." },
  { title: "Structure Projects & Tasks", text: "Define project goals, set priority levels, assign due dates, and break down deliverables into subtasks." },
  { title: "Collaborate, Track & Deliver", text: "Maintain momentum with in-task discussions, real-time status updates, and milestone tracking." },
];

const NAV = [
  ["#home", "Home"],
  ["#features", "Features"],
  ["#workflow", "How It Works"],
  ["#legal", "Legal"],
];

const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-sans";
const h3 = "text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white font-sans";
const body = "mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans";

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center pb-16">
      <h2 className={`${h2} text-zinc-950 dark:text-white`}>{title}</h2>
      <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-sans">{subtitle}</p>
    </div>
  );
}

// Public home page: hero, features, workflow, call to action, footer.
export function LandingPage() {
  const { user, isLoading, logout } = useAuth();
  const { navigate } = useApp();
  const homeLink = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-dark-bg dark:text-zinc-100 font-sans transition-colors duration-200 selection:bg-brand-600 selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md text-zinc-900 dark:text-white transition-colors duration-200">
        <div className={`${container} h-20 flex items-center justify-between gap-4`}>
          <a href="/" onClick={homeLink} className="flex items-center group shrink-0">
            <Logo />
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium font-sans text-zinc-600 dark:text-zinc-300">
            {NAV.map(([href, label], i) => (
              <a key={href} href={href} className={i === 0 ? "text-zinc-950 dark:text-white transition-colors" : "hover:text-zinc-950 dark:hover:text-white transition-colors"}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800/60 animate-pulse rounded-none" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/onboarding")}
                  title="Open Workspace"
                  className="flex items-center gap-2.5 p-1 rounded-none hover:bg-zinc-100 dark:hover:bg-dark-card border border-transparent hover:border-zinc-200 dark:hover:border-dark-border transition-all cursor-pointer group focus:outline-none"
                >
                  <Avatar size="sm" name={`${user.firstName} ${user.lastName}`} src={user.avatarPath || undefined} />
                  <span className="hidden md:inline text-xs font-semibold text-zinc-900 dark:text-white font-sans group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {user.firstName} {user.lastName}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Sign Out"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate("/signup")} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Sign Up
                </Button>
              </>
            )}
            <ThemeToggle className="mx-0.5" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero, The big banner */}
        <section id="home" className="relative min-h-[600px] lg:min-h-[680px] bg-dark-bg text-white overflow-hidden flex flex-col justify-center py-20 md:py-28 lg:py-36 border-b border-zinc-800">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <img
              src="/images/hero-cinematic.jpg"
              alt="Trenno High Performance Team"
              className="h-full w-full object-cover object-[center_right] opacity-85 lg:opacity-90 scale-100 transition-all duration-700"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-brand-600/20 to-brand-700/35 mix-blend-color" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/85 via-45% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-dark-bg/60" />
          </div>
          <div className={`${container} w-full relative z-10`}>
            <div className="max-w-2xl lg:max-w-3xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] font-sans">
                The modern platform <span className="text-brand-500 relative inline-block mx-1">built</span> to accelerate your team sprints.
			  </h1>
              <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl font-sans">
                Streamline sprint cycles, cross-functional engineering, and team execution in one distraction-free workspace.
              </p>
            </div>
          </div>

        </section>

        {/* Features */}
        <section id="features" className="py-20 md:py-28 bg-zinc-50 dark:bg-dark-bg">
          <div className={container}>
            <SectionTitle
              title="Engineered For Peak Team Productivity"
              subtitle="Teams organize work into organizations, projects, and tasks to streamline sprint workflows, track deadlines, and accelerate delivery."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURES.map(({ icon: Icon, title, text, preview }) => (
                <Card key={title} padding="lg" className="group hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-none bg-brand-50 dark:bg-brand-950/30 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors mb-6 border border-brand-200 dark:border-brand-900/40">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className={`${h3} group-hover:text-brand-600 transition-colors`}>{title}</h3>
                    <p className={body}>{text}</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-dark-border">{preview}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="py-20 md:py-28 bg-zinc-50 dark:bg-dark-bg">
          <div className={container}>
            <SectionTitle title="How Trenno Powers Your Sprints" subtitle="A streamlined workflow designed to keep teams aligned from kickoff to delivery." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <Card key={step.title} padding="lg" className="hover:shadow-md">
                  <div className="text-4xl sm:text-5xl font-extrabold text-brand-600/30 font-sans tracking-tight mb-4">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className={h3}>{step.title}</h3>
                  <p className={body}>{step.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 md:py-24 bg-dark-bg text-white relative overflow-hidden border-t border-zinc-800">
          <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-none bg-brand-600/15 blur-3xl" />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className={`${h2} text-white`}>Ready to organize your team's tasks with total clarity?</h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed font-sans">
              Start setting up your workspace in minutes. Experience task collaboration tailored for modern teams.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate(user ? "/onboarding" : "/signup")}>
                Get Started Free Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer id="legal" className="border-t border-zinc-200/90 dark:border-dark-border bg-zinc-50 dark:bg-dark-bg text-zinc-600 dark:text-zinc-400 py-14 transition-colors">
        <div className={container}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b border-zinc-200 dark:border-dark-border">
            <div className="max-w-md">
              <a href="/" onClick={homeLink} className="inline-flex items-center group mb-3">
                <Logo />
              </a>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                The modern collaborative task management application designed for productive teams and structured project workflows.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white mb-3 font-sans">Legal & System</h4>
              <ul className="flex flex-wrap gap-6 text-xs sm:text-sm font-sans">
                <li>
                  <LegalLink to="privacy" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white" />
                </li>
                <li>
                  <LegalLink to="terms" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white" />
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            <div>
              &copy; {new Date().getFullYear()} <span className="font-semibold text-zinc-950 dark:text-white font-sans">Trenno</span> All rights reserved.
            </div>
            <ThemeToggle variant="pill" />
          </div>
        </div>
      </footer>

    </div>
  );
}