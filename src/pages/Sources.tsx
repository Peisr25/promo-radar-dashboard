import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, ShoppingBag, Settings2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Source = Tables<"scraper_sources">;

export default function Sources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [form, setForm] = useState({ name: "", url: "", site_name: "", scrape_interval_minutes: 60 });
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Shopee state
  const [shopeeConfigured, setShopeeConfigured] = useState(false);
  const [shopeeConfigOpen, setShopeeConfigOpen] = useState(false);
  const [shopeeAppId, setShopeeAppId] = useState("");
  const [shopeeAppSecret, setShopeeAppSecret] = useState("");
  const [shopeeSaving, setShopeeSaving] = useState(false);
  const [shopeeSyncing, setShopeeSyncing] = useState(false);

  const fetchSources = async () => {
    const { data } = await supabase.from("scraper_sources").select("*").order("created_at", { ascending: false });
    setSources(data ?? []);
    setLoading(false);
  };

  const fetchShopeeCredentials = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("source_credentials" as any)
      .select("credentials")
      .eq("user_id", user.id)
      .eq("source_name", "shopee")
      .maybeSingle();
    if (data) {
      setShopeeConfigured(true);
      const creds = (data as any).credentials as { app_id?: string; app_secret?: string };
      setShopeeAppId(creds?.app_id ?? "");
      setShopeeAppSecret("");
    } else {
      setShopeeConfigured(false);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchShopeeCredentials();
  }, [user]);

  // Polling: refresh every 30s while any source is "running"
  useEffect(() => {
    const hasRunning = sources.some((s) => s.status === "running");
    if (!hasRunning) return;
    const interval = setInterval(fetchSources, 30000);
    return () => clearInterval(interval);
  }, [sources]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", url: "", site_name: "", scrape_interval_minutes: 60 });
    setDialogOpen(true);
  };

  const openEdit = (s: Source) => {
    setEditing(s);
    setForm({ name: s.name, url: s.url, site_name: (s as any).site_name || "", scrape_interval_minutes: s.scrape_interval_minutes });
    setDialogOpen(true);
  };

  const handleSync = async (source: Source) => {
    setSyncingId(source.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ source_id: source.id, site_name: (source as any).site_name }),
      });
      if (res.ok) {
        await supabase
          .from("scraper_sources")
          .update({ status: "running", last_run_at: new Date().toISOString() })
          .eq("id", source.id);
        await fetchSources();
        toast({ title: "Sincronização iniciada", description: "Os produtos aparecerão em breve." });
      } else {
        const err = await res.text();
        toast({ title: "Erro ao sincronizar", description: err, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao sincronizar", description: e.message, variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase.from("scraper_sources").update(form).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("scraper_sources").insert({ ...form, user_id: user.id });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    setDialogOpen(false);
    fetchSources();
  };

  const toggleActive = async (s: Source) => {
    await supabase.from("scraper_sources").update({ is_active: !s.is_active }).eq("id", s.id);
    fetchSources();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("scraper_sources").delete().eq("id", id);
    fetchSources();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      running: { label: "A Rodar", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      error: { label: "Erro", variant: "destructive" },
    };
    const s = map[status] ?? map.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  // Shopee handlers
  const handleShopeeOpenConfig = () => {
    fetchShopeeCredentials();
    setShopeeConfigOpen(true);
  };

  const handleShopeeSave = async () => {
    if (!user) return;
    setShopeeSaving(true);
    try {
      const credentials: Record<string, string> = { app_id: shopeeAppId };
      // Only update secret if user typed a new one
      if (shopeeAppSecret) {
        credentials.app_secret = shopeeAppSecret;
      } else if (shopeeConfigured) {
        // Keep existing secret — fetch it
        const { data } = await supabase
          .from("source_credentials" as any)
          .select("credentials")
          .eq("user_id", user.id)
          .eq("source_name", "shopee")
          .maybeSingle();
        if (data) {
          const existing = (data as any).credentials as { app_secret?: string };
          credentials.app_secret = existing?.app_secret ?? "";
        }
      }

      const { error } = await (supabase.from("source_credentials" as any) as any).upsert(
        {
          user_id: user.id,
          source_name: "shopee",
          credentials,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,source_name" }
      );
      if (error) throw error;

      toast({ title: "Credenciais Shopee salvas!" });
      setShopeeConfigured(true);
      setShopeeConfigOpen(false);
      setShopeeAppSecret("");
    } catch (e: any) {
      toast({ title: "Erro ao salvar credenciais", description: e.message, variant: "destructive" });
    } finally {
      setShopeeSaving(false);
    }
  };

  const handleShopeeSync = async () => {
    setShopeeSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ source: "shopee" }),
      });
      if (res.ok) {
        toast({ title: "Sincronização Shopee iniciada", description: "Os produtos aparecerão em breve." });
      } else {
        const err = await res.text();
        toast({ title: "Erro ao sincronizar Shopee", description: err, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao sincronizar Shopee", description: e.message, variant: "destructive" });
    } finally {
      setShopeeSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fontes de Scraping</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Fonte</Button>
      </div>

      {/* Shopee Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopee Afiliados
          </CardTitle>
          <Badge variant={shopeeConfigured ? "default" : "secondary"}>
            {shopeeConfigured ? "Pronto" : "Não Configurado"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte a API de Afiliados da Shopee para importar produtos automaticamente.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShopeeOpenConfig}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar API
            </Button>
            <Button
              size="sm"
              onClick={handleShopeeSync}
              disabled={!shopeeConfigured || shopeeSyncing}
            >
              {shopeeSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sincronizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : sources.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma fonte adicionada. Clica em "Nova Fonte" para começar.</div>
          ) : (
            <Table>
              <TableHeader>
                 <TableRow>
                   <TableHead>Nome</TableHead>
                   <TableHead className="hidden md:table-cell">URL</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="hidden sm:table-cell">Última Execução</TableHead>
                   <TableHead>Ativo</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">{s.url}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {s.last_run_at
                        ? formatDistanceToNow(new Date(s.last_run_at), { addSuffix: true, locale: pt })
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleSync(s)} disabled={syncingId === s.id}>
                        {syncingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fonte" : "Nova Fonte"}</DialogTitle>
            <DialogDescription>Preenche os dados da fonte de scraping.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome (ex: Ofertas Magalu)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Identificador do site (ex: magalu)" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
            <Input placeholder="URL alvo" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Input type="number" placeholder="Intervalo (minutos)" value={form.scrape_interval_minutes} onChange={(e) => setForm({ ...form, scrape_interval_minutes: Number(e.target.value) })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shopeeConfigOpen} onOpenChange={setShopeeConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar API Shopee</DialogTitle>
            <DialogDescription>Insira as credenciais da API de Afiliados da Shopee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">App ID</label>
              <Input
                placeholder="Seu App ID da Shopee"
                value={shopeeAppId}
                onChange={(e) => setShopeeAppId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">App Secret</label>
              <Input
                type="password"
                placeholder={shopeeConfigured ? "••••••• (deixe vazio para manter)" : "Seu App Secret"}
                value={shopeeAppSecret}
                onChange={(e) => setShopeeAppSecret(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShopeeConfigOpen(false)}>Cancelar</Button>
            <Button onClick={handleShopeeSave} disabled={!shopeeAppId || shopeeSaving}>
              {shopeeSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
