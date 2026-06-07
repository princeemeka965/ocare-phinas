"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

interface Group {
  id: string;
  reference: string;
  name: string;
  totalSlots: number;
  slotsFilled: number;
  cycleLengthDays: number;
  status: "open" | "closed" | "completed";
  createdAt: string;
  _count: { memberships: number };
}

const STATUS_META = {
  open: { label: "Open", variant: "success" as const },
  closed: { label: "Full", variant: "warning" as const },
  completed: { label: "Completed", variant: "secondary" as const },
};

export function GroupsBoard() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);

  function load() {
    api
      .get<{ groups: Group[] }>("/api/admin/groups")
      .then((d) => setGroups(d.groups))
      .catch(() => setGroups([]));
  }

  useEffect(load, []);

  async function createGroup() {
    const open = (groups ?? []).filter((g) => g.status === "open").length;
    const name = `Group ${(groups?.length ?? 0) + 1}`;
    setCreating(true);
    try {
      await api.post("/api/admin/groups", { name });
      toast.success(`New group opened.${open > 0 ? " A previous group is still open." : ""}`, "Group created");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create a group.");
    } finally {
      setCreating(false);
    }
  }

  async function closeGroup(g: Group) {
    setClosing(g.id);
    try {
      await api.post(`/api/admin/groups/${g.id}/close`);
      toast.info(`${g.reference} closed to new members.`, "Group closed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't close the group.");
    } finally {
      setClosing(null);
    }
  }

  if (groups === null) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={createGroup} disabled={creating} className="gap-2">
          <Plus className="size-4" /> {creating ? "Creating…" : "Open a group"}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
          No groups yet. Open one to let customers join.
        </div>
      ) : (
        groups.map((group) => {
          const meta = STATUS_META[group.status];
          return (
            <div key={group.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-bold font-mono">{group.reference}</span>
                      <Badge variant={meta.variant} className="text-micro">{meta.label}</Badge>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Started {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · ₦1,000/day per slot · {group._count.memberships} member{group._count.memberships !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {group.status === "open" && (
                  <button
                    onClick={() => closeGroup(group)}
                    disabled={closing === group.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-body-sm hover:bg-muted transition-colors disabled:opacity-60"
                  >
                    <Lock className="size-3.5" /> {closing === group.id ? "Closing…" : "Close group"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(group.slotsFilled / group.totalSlots) * 100}%` }} />
                </div>
                <span className="text-caption font-semibold flex-shrink-0">{group.slotsFilled}/{group.totalSlots} slots</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
