import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, Input, PageHeader, Spinner, Textarea, useToast } from "../components";
import { useAsync } from "../lib/hooks";
import { AppLayout } from "./AppLayout";
import { useApp } from "../context/AppContext";
import { ConsequenceList, Consequence } from "./admin/adminUi";
import { plural } from "../lib/format";

// /org/settings (Org Admin): edit and delete the organization.
export function OrgSettingsPage() {
  const toast = useToast();
  const { navigate } = useApp();
  const { organization, refreshUser } = useAuth();
  const [counts, setCounts] = useState<{ memberCount: number; projectCount: number } | null>(null);
  const [name, setName] = useState(organization?.name ?? "");
  const [description, setDescription] = useState(organization?.description ?? "");
  const { busy: saving, error, setError, run } = useAsync();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!organization) return;
    authApi
      .getOrg(organization.id)
      .then(({ organization: o }) => {
        setName(o.name);
        setDescription(o.description ?? "");
        setCounts({ memberCount: o.memberCount, projectCount: o.projectCount });
      })
      .catch((err) => setError(err.message));
  }, [organization?.id]);

  if (!organization) return null;

  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const saved = await run(async () => {
      await authApi.updateOrg(organization.id, { name: name.trim(), description: description.trim() || undefined });
      await refreshUser();
      return true;
    });
    if (saved) toast.success("Changes saved", "Members see the new details right away.");
  };

  const handleDelete = async () => {
    try {
      const res = await authApi.deleteOrg(organization.id, organization.name);
      toast.success("Organization deleted", res.message);
      await refreshUser();
      navigate("/onboarding");
    } catch (err) {
      toast.error("Couldn't delete this organization", (err as Error).message);
      throw err;
    }
  };

  const consequences: Consequence[] = [];
  if (counts) {
    if (counts.projectCount > 0) {
      consequences.push({ kind: "change", text: `${plural(counts.projectCount, "project")} and everything in them are deleted` });
    }
    consequences.push({
      kind: "change",
      text:
        counts.memberCount > 1
          ? `${counts.memberCount} members (you included) lose access and become unaffiliated; friendships between them end`
          : "You lose access and become unaffiliated",
    });
    consequences.push({ kind: "change", text: "Pending invitations are revoked" });
    consequences.push({ kind: "notify", text: `Every member gets an email saying ${organization.name} was deleted` });
    consequences.push({ kind: "keep", text: "Member accounts, which stay active" });
    consequences.push({ kind: "keep", text: `The name “${organization.name}”, which becomes free to reuse` });
  }

  return (
    <AppLayout>
      <PageHeader title="Organization settings" subtitle={`Details and danger zone for ${organization.name}.`} />

      <Card padding="lg" className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>The name must be unique across Trenno.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <Alert variant="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} disabled={saving} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={4} disabled={saving} />
            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-dark-border">
              <Button type="submit" isLoading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card padding="lg" className="max-w-2xl border-destructive-200 dark:border-destructive-900">
        <CardHeader>
          <CardTitle>Delete organization</CardTitle>
          <CardDescription>Deletes {organization.name} and everything in it. There's no undo in the app.</CardDescription>
        </CardHeader>
        <CardContent>
          {counts ? (
            <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteOpen(true)}>
              Delete organization
            </Button>
          ) : (
            <Spinner label="Loading" />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Delete organization"
        description={`${organization.name} and everything in it will be deleted. There's no undo in the app.`}
        confirmLabel="Delete organization"
        typedConfirmationText={organization.name}
      >
        <ConsequenceList items={consequences} />
      </ConfirmDialog>
    </AppLayout>
  );
}
