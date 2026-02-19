import { supabase } from "@/integrations/supabase/client";

export async function testEvolutionConnection(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
    body: { action: "test" },
  });
  if (error) return { success: false, message: error.message };
  return { success: data?.success ?? false, message: data?.message ?? "Erro desconhecido" };
}

export async function fetchEvolutionGroups(filters?: { limit?: number }): Promise<{ success: boolean; groups?: any[]; message?: string }> {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
    body: { action: "fetch_groups", ...filters },
  });
  if (error) return { success: false, message: error.message };
  return { success: data?.success ?? false, groups: data?.groups, message: data?.message };
}

export async function sendWhatsAppMessage(groupId: string, text: string): Promise<{ success: boolean; message: string; data?: any }> {
  const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
    body: { action: "send", group_id: groupId, text },
  });
  if (error) return { success: false, message: error.message };
  return { success: data?.success ?? false, message: data?.message ?? "Erro", data: data?.data };
}
