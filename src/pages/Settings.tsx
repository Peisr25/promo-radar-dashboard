import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gemini_api_key: "",
    default_system_prompt: "Sê criativo e engraçado. Cria uma mensagem promocional curta e divertida para WhatsApp.",
    magalu_id: "",
    amazon_tag: "",
    whatsapp_groups: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const tags = (data.affiliate_tags as Record<string, string>) ?? {};
        const groups = Array.isArray(data.whatsapp_groups) ? (data.whatsapp_groups as string[]).join(", ") : "";
        setForm({
          gemini_api_key: data.gemini_api_key ?? "",
          default_system_prompt: data.default_system_prompt ?? "",
          magalu_id: tags.magalu_id ?? "",
          amazon_tag: tags.amazon_tag ?? "",
          whatsapp_groups: groups,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      gemini_api_key: form.gemini_api_key || null,
      default_system_prompt: form.default_system_prompt,
      affiliate_tags: { magalu_id: form.magalu_id, amazon_tag: form.amazon_tag },
      whatsapp_groups: form.whatsapp_groups.split(",").map((s) => s.trim()).filter(Boolean),
    };

    const { error } = await supabase.from("settings").upsert(payload, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações guardadas!" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle>API Gemini</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Chave API do Gemini</label>
            <Input type="password" placeholder="AIza..." value={form.gemini_api_key} onChange={(e) => setForm({ ...form, gemini_api_key: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">System Prompt Padrão</label>
            <Textarea rows={4} value={form.default_system_prompt} onChange={(e) => setForm({ ...form, default_system_prompt: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tags de Afiliado</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">ID Magalu</label>
            <Input placeholder="Ex: minha_loja_123" value={form.magalu_id} onChange={(e) => setForm({ ...form, magalu_id: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Tag Amazon</label>
            <Input placeholder="Ex: meublog-20" value={form.amazon_tag} onChange={(e) => setForm({ ...form, amazon_tag: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>
        <CardContent>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Grupos de Destino (separados por vírgula)</label>
            <Input placeholder="Ex: Promos VIP, Ofertas Tech" value={form.whatsapp_groups} onChange={(e) => setForm({ ...form, whatsapp_groups: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar Configurações
      </Button>
    </div>
  );
}
