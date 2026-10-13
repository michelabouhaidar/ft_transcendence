import { ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

// Small page-level building blocks shared by most screens.

export function PageHeader({ title, subtitle, actions, className = "" }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={`${actions ? "flex flex-col sm:flex-row sm:items-end justify-between gap-4" : ""} ${className}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Loading({ label, className = "py-24" }: { label: string; className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function LoadError({ what, message, onRetry, className }: { what: string; message: string; onRetry: () => void; className?: string }) {
  return (
    <Alert
      variant="error"
      className={className}
      action={
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      Couldn't load {what}: {message}
    </Alert>
  );
}

// "Page 2 of 5 · 93 members" with Previous / Next.
export function Pager({ page, total, pageSize, noun, onPage }: { page: number; total: number; pageSize: number; noun: string; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
      <span>
        Page {page} of {pages} · {total} {noun}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
