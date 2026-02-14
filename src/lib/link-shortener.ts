import { supabase } from "@/integrations/supabase/client";

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function shortenLink(params: {
  originalUrl: string;
  promotionId?: string;
}): Promise<{ shortCode: string; shortUrl: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { shortCode: "", shortUrl: "", error: "Usuário não autenticado" };
  }

  // Check if link already exists
  const { data: existing } = await supabase
    .from("short_links")
    .select("short_code")
    .eq("original_url", params.originalUrl)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const shortUrl = `${window.location.origin}/r/${existing.short_code}`;
    return { shortCode: existing.short_code, shortUrl };
  }

  // Generate unique code
  let shortCode = generateShortCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: dup } = await supabase
      .from("short_links")
      .select("id")
      .eq("short_code", shortCode)
      .maybeSingle();
    if (!dup) break;
    shortCode = generateShortCode();
    attempts++;
  }

  const { data, error } = await supabase
    .from("short_links")
    .insert({
      user_id: user.id,
      original_url: params.originalUrl,
      short_code: shortCode,
      promotion_id: params.promotionId ?? null,
    })
    .select("short_code")
    .single();

  if (error) {
    return { shortCode: "", shortUrl: "", error: error.message };
  }

  const shortUrl = `${window.location.origin}/r/${data.short_code}`;
  return { shortCode: data.short_code, shortUrl };
}

export async function resolveAndTrack(shortCode: string): Promise<string | null> {
  const { data: link } = await supabase
    .from("short_links")
    .select("id, original_url")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (!link) return null;

  // Track click
  await supabase.from("click_logs").insert({
    short_link_id: link.id,
    user_agent: navigator.userAgent,
    referer: document.referrer || null,
  });

  return link.original_url;
}
