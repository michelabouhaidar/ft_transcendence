import { useState } from "react";
import { UserMinus, UserPlus, Check, X } from "lucide-react";
import { usersApi, FriendshipState } from "../../api/users";
import { Badge, Button, ConfirmDialog, useToast } from "../../components";

interface FriendButtonProps {
  userId: string;
  name: string;
  state: FriendshipState;
  friendshipId: string | null;
  /** Called after any successful change so the parent can reload. */
  onChanged: () => void;
  size?: "sm" | "md";
}

// Add / pending / accept-decline / friends+remove, shared by the profile page and the directory.
export function FriendButton({ userId, name, state, friendshipId, onChanged, size = "sm" }: FriendButtonProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const run = async (action: () => Promise<unknown>, successTitle: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(successTitle);
    } catch (err) {
      toast.error("Couldn't complete that", (err as Error).message);
    } finally {
      setBusy(false);
      onChanged();
    }
  };

  if (state === "NONE") {
    return (
      <Button variant="outline" size={size} isLoading={busy} leftIcon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => run(() => usersApi.sendFriendRequest(userId), "Friend request sent")}>
        Add friend
      </Button>
    );
  }

  if (state === "OUTGOING") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="warning" size="sm">Request sent</Badge>
        <Button variant="ghost" size={size} disabled={busy || !friendshipId} onClick={() => friendshipId && run(() => usersApi.removeFriendship(friendshipId), "Request cancelled")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (state === "INCOMING") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="primary" size={size} disabled={busy || !friendshipId} leftIcon={<Check className="w-3.5 h-3.5" />} onClick={() => friendshipId && run(() => usersApi.acceptFriendRequest(friendshipId), "Friend request accepted")}>
          Accept
        </Button>
        <Button variant="outline" size={size} disabled={busy || !friendshipId} leftIcon={<X className="w-3.5 h-3.5" />} onClick={() => friendshipId && run(() => usersApi.declineFriendRequest(friendshipId), "Friend request declined")}>
          Decline
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="active" size="sm">Friends</Badge>
        <Button variant="ghost" size={size} disabled={!friendshipId} leftIcon={<UserMinus className="w-3.5 h-3.5" />} onClick={() => setConfirmRemove(true)}>
          Remove
        </Button>
      </div>
      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove friend?"
        description={`${name} will be removed from your friends. You can send a new request later.`}
        confirmLabel="Remove friend"
        onConfirm={async () => {
          if (friendshipId) await run(() => usersApi.removeFriendship(friendshipId), "Friend removed");
          setConfirmRemove(false);
        }}
      />
    </>
  );
}
