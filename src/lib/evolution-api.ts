import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function invokeEdge(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-message", { body });
  if (error) return { success: false, message: error.message } as const;
  return { success: data?.success ?? false, ...data } as Record<string, any>;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export async function testEvolutionConnection(): Promise<{ success: boolean; message: string }> {
  const res = await invokeEdge({ action: "test" });
  return { success: res.success, message: res.message ?? "Erro desconhecido" };
}

// ---------------------------------------------------------------------------
// Groups — Fetch
// ---------------------------------------------------------------------------

export async function fetchEvolutionGroups(filters?: { limit?: number }): Promise<{ success: boolean; groups?: any[]; message?: string }> {
  const res = await invokeEdge({ action: "fetch_groups", ...filters });
  return { success: res.success, groups: res.groups, message: res.message };
}

// ---------------------------------------------------------------------------
// Groups — Invite Code
// ---------------------------------------------------------------------------

export async function fetchGroupInviteCode(groupJid: string): Promise<{ success: boolean; inviteCode?: string; inviteUrl?: string; message?: string }> {
  const res = await invokeEdge({ action: "fetch_invite_code", group_jid: groupJid });
  return { success: res.success, inviteCode: res.inviteCode, inviteUrl: res.inviteUrl, message: res.message };
}

export async function revokeGroupInviteCode(groupJid: string): Promise<{ success: boolean; inviteCode?: string; inviteUrl?: string; message?: string }> {
  const res = await invokeEdge({ action: "revoke_invite_code", group_jid: groupJid });
  return { success: res.success, inviteCode: res.inviteCode, inviteUrl: res.inviteUrl, message: res.message };
}

// ---------------------------------------------------------------------------
// Groups — Update Subject / Description
// ---------------------------------------------------------------------------

export async function updateGroupSubject(groupJid: string, subject: string): Promise<{ success: boolean; message?: string }> {
  const res = await invokeEdge({ action: "update_group_subject", group_jid: groupJid, subject });
  return { success: res.success, message: res.message };
}

export async function updateGroupDescription(groupJid: string, description: string): Promise<{ success: boolean; message?: string }> {
  const res = await invokeEdge({ action: "update_group_description", group_jid: groupJid, description });
  return { success: res.success, message: res.message };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendWhatsAppMessage(groupId: string, text: string, imageUrl?: string | null): Promise<{ success: boolean; message: string; data?: any }> {
  const res = await invokeEdge({ action: "send", group_id: groupId, text, image_url: imageUrl ?? undefined });
  return { success: res.success, message: res.message ?? "Erro", data: res.data };
}
