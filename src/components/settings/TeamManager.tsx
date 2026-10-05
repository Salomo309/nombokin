"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Copy, Loader2, Users, Link2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER" | "ADMIN";
  createdAt: string;
}

interface PendingInvite {
  id: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface TeamManagerProps {
  role: string;
  userId: string;
  tier: string;
}

export function TeamManager({ role, userId, tier }: TeamManagerProps) {
  const confirm = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const isOwner = role === "OWNER" || role === "ADMIN";
  const isBusiness = tier === "BUSINESS";

  async function loadTeam() {
    try {
      const res = await fetch("/api/team/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setInvites(data.invites);
      }
    } catch (err) {
      console.error("Gagal memuat tim:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async () => {
    setInviting(true);
    setLastInviteUrl(null);
    try {
      const res = await fetch("/api/team/invite", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLastInviteUrl(data.inviteUrl);
        toast({ variant: "success", title: "Invite link created! Share it via WhatsApp." });
        await loadTeam();
      } else {
        toast({ variant: "destructive", title: data.error || "Failed to create invite" });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Server connection error" });
    } finally {
      setInviting(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ variant: "success", title: "Copied to clipboard" });
    } catch {
      toast({ title: `Salin manual: ${text}` });
    }
  };

  const handleRoleChange = async (m: Member, newRole: string) => {
    try {
      const res = await fetch(`/api/team/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ variant: "success", title: "Member role updated. It applies after they log in again." });
        await loadTeam();
      } else {
        toast({ variant: "destructive", title: data.error || "Failed to update role" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (m: Member) => {
    const ok = await confirm({
      title: "Remove member?",
      description: `Hapus ${m.name} (${m.email}) dari tim? Mereka langsung kehilangan akses.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/team/members/${m.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({ variant: "success", title: "Member removed successfully" });
        await loadTeam();
      } else {
        toast({ variant: "destructive", title: data.error || "Failed to remove member" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat tim...
      </div>
    );
  }

  if (!isBusiness) {
    return (
      <div className="rounded-lg bg-secondary/40 border border-border/60 p-4 text-xs text-muted-foreground leading-relaxed text-center space-y-1">
        <p>Fitur tim (maksimal 5 anggota) tersedia untuk paket BISNIS. Upgrade di tab Langganan untuk mengundang anggota.</p>
        <p>Kembali ke PRO tidak memulihkan anggota beku — hanya BISNIS yang memulihkan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Undang Anggota
            </CardTitle>
            <CardDescription className="text-[11px]">
              Buat link undangan (berlaku 7 hari, sekali pakai), lalu kirim manual via WhatsApp.
              Maksimal 5 anggota per tim.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleInvite} disabled={inviting} size="sm" className="gap-1.5 text-xs shadow-xs">
              {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              {inviting ? "Membuat..." : "Buat Link Undangan"}
            </Button>
            {lastInviteUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/60 p-3">
                <p className="flex-1 truncate text-[11px] text-foreground tabular-nums">{lastInviteUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-[11px] shrink-0"
                  onClick={() => handleCopy(lastInviteUrl)}
                >
                  <Copy className="h-3.5 w-3.5" /> Salin
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Anggota ({members.length}/5)
          </CardTitle>
          <CardDescription className="text-[11px]">
            {isOwner
              ? "Kelola peran dan akses anggota tim."
              : "Kamu masuk sebagai anggota. Pengaturan tagihan hanya untuk pemilik."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <table className="w-full text-left text-xs border-collapse">
            <tbody className="divide-y divide-border/60">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-6">
                    <p className="font-semibold text-foreground">
                      {m.name} {m.id === userId && <span className="text-muted-foreground font-normal">(kamu)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="py-2.5 px-6 text-right">
                    {isOwner && m.id !== userId && m.role !== "ADMIN" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Select value={m.role} onValueChange={(v) => handleRoleChange(m, v)}>
                          <SelectTrigger className="h-8 w-28 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER">Pemilik</SelectItem>
                            <SelectItem value="MEMBER">Anggota</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        {m.role === "OWNER" ? "Pemilik" : m.role === "ADMIN" ? "Admin" : "Anggota"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {isOwner && invites.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {invites.length} undangan aktif menunggu dipakai (kedaluwarsa otomatis setelah 7 hari).
        </p>
      )}
    </div>
  );
}
