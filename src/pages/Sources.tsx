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
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
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

  const fetchSources = async () => {
    const { data } = await supabase.from("scraper_sources").select("*").order("created_at", { ascending: false });
    setSources(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, [user]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fontes de Scraping</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Fonte</Button>
      </div>

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
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
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
    </div>
  );
}
