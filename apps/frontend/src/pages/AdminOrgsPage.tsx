import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { authApi, AdminOrgItem } from "../api/auth";
import { Button, EmptyState, FormDialog, Input, LoadError, Loading, PageHeader, Textarea, useToast } from "../components";
import { useApp } from "../context/AppContext";
import { useAsync } from "../lib/hooks";
import { AppLayout, Trail } from "./AppLayout";
import { formatDate } from "../lib/format";

export function AdminOrgsPage() {
  const { navigate } = useApp();
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchOrgs = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.adminGetOrgs();
      setOrgs(res.organizations);
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) => o.name.toLowerCase().includes(q) || (o.description ?? "").toLowerCase().includes(q)
    );
  }, [orgs, searchQuery]);

  return (
    <AppLayout variant="admin" trail={<Trail items={[{ label: "Admin" }, { label: "Organizations" }]} />}>
      <PageHeader
        className="mb-6"
        title="Organizations"
        subtitle="Every team workspace on Trenno. Open one to see its members and projects, rename it or delete it."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New organization
          </Button>
        }
      />

      <div className="max-w-md mb-4">
        <Input
          type="search"
          aria-label="Search organizations"
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {loadError && <LoadError className="mb-4" what="organizations" message={loadError} onRetry={fetchOrgs} />}

      {isLoading && orgs.length === 0 ? (
        <Loading label="Loading organizations" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={orgs.length === 0 ? "No organizations yet" : "No organizations match"}
          description={
            orgs.length === 0
              ? "Create one and invite its first Org Admin, or wait for users to create their own."
              : `Nothing matches “${searchQuery.trim()}”.`
          }
          action={
            orgs.length === 0
              ? { label: "New organization", onClick: () => setIsCreateOpen(true), icon: <Plus className="w-4 h-4" /> }
              : { label: "Clear search", onClick: () => setSearchQuery("") }
          }
        />
      ) : (
        <div className="border border-zinc-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-dark-border text-xs text-zinc-500 dark:text-zinc-400">
                <th scope="col" className="py-2.5 px-4 font-medium">Name</th>
                <th scope="col" className="py-2.5 px-4 font-medium text-right">Members</th>
                <th scope="col" className="py-2.5 px-4 font-medium text-right">Projects</th>
                <th scope="col" className="py-2.5 px-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-dark-border">
              {filtered.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => navigate(`/admin/orgs/${org.id}`)}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-dark-elevated transition-colors"
                >
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/orgs/${org.id}`);
                      }}
                      className="font-semibold text-zinc-900 dark:text-white hover:underline cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {org.name}
                    </button>
                    {org.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md mt-0.5">{org.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{org.memberCount}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{org.projectCount}</td>
                  <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(org.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateOrgDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          setIsCreateOpen(false);
          navigate(`/admin/orgs/${id}`);
        }}
      />
    </AppLayout>
  );
}

// SA path: the SA creates the org without joining it and invites the first OA.
function CreateOrgDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstOaEmail, setFirstOaEmail] = useState("");
  const { busy: saving, error, setError, run } = useAsync();

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setFirstOaEmail("");
    setError(null);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (name.trim().length < 2) return setError("The name needs at least 2 characters.");
    const res = await run(() =>
      authApi.adminCreateOrg({ name: name.trim(), description: description.trim() || undefined, firstOaEmail: firstOaEmail.trim() || undefined })
    );
    if (res) {
      toast.success("Organization created", res.message);
      onCreated(res.organization.id);
    }
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="New organization"
      description="You won't join it. Invite someone to run it as its first Org Admin."
      onSubmit={handleSubmit}
      submitLabel="Create organization"
      busy={saving}
      error={error}
      onDismissError={() => setError(null)}
    >
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Northwind Studio"
          required
          minLength={2}
          maxLength={100}
          autoFocus
          disabled={saving}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          disabled={saving}
        />
        <Input
          label="First Org Admin"
          type="email"
          value={firstOaEmail}
          onChange={(e) => setFirstOaEmail(e.target.value)}
          placeholder="name@company.com"
          helperText="Optional. They get an invitation to manage this organization. You can also invite one later from Users."
          disabled={saving}
        />
    </FormDialog>
  );
}
