import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ExternalLink, Copy, Link2, MousePointerClick, BarChart3, Activity, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShortLink {
  id: string;
  created_at: string;
  original_url: string;
  short_code: string;
  product_title: string | null;
  source: string | null;
  click_count: number;
  last_clicked_at: string | null;
  is_active: boolean;
  promotion_id: string | null;
}

export default function ShortLinks() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("short_links")
      .select("*")
      .order("created_at", { ascending: false }) as { data: ShortLink[] | null };

    setLinks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const totalClicks = links.reduce((s, l) => s + (l.click_count || 0), 0);
  const activeLinks = links.filter((l) => l.is_active).length;
  const avgClicks = links.length > 0 ? (totalClicks / links.length).toFixed(1) : "0";

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast({ title: "Link copiado!" });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("short_links").update({ is_active: !current } as any).eq("id", id);
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l));
    toast({ title: current ? "Link desativado" : "Link ativado" });
  };

  const deleteLink = async (id: string) => {
    await supabase.from("short_links").delete().eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Link excluído" });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Links Encurtados</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total de Links", value: links.length, icon: Link2 },
          { label: "Total de Cliques", value: totalClicks, icon: MousePointerClick },
          { label: "Média Cliques/Link", value: avgClicks, icon: BarChart3 },
          { label: "Links Ativos", value: activeLinks, icon: Activity },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Links ({links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum link encurtado ainda. Processe uma promoção no Pipeline para criar o primeiro link.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Link Curto</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead>Último Clique</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="max-w-[200px]">
                      <span className="line-clamp-2 text-sm font-medium">
                        {link.product_title || new URL(link.original_url).hostname}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-muted-foreground">/r/{link.short_code}</code>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(link.short_code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{link.click_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {link.last_clicked_at
                        ? new Date(link.last_clicked_at).toLocaleString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      {link.source ? (
                        <Badge variant="secondary" className="text-xs">{link.source}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={() => toggleActive(link.id, link.is_active)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {link.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(link.original_url, "_blank")}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir link?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O link deixará de funcionar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLink(link.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
