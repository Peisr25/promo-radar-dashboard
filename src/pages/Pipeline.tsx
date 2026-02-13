import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Copy, Check, Send } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type RawScrape = Tables<"raw_scrapes">;
type Promotion = Tables<"promotions">;

export default function Pipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scrapes, setScrapes] = useState<RawScrape[]>([]);
  const [reviewItems, setReviewItems] = useState<Promotion[]>([]);
  const [queueItems, setQueueItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAll = async () => {
    const [s, r, q] = await Promise.all([
      supabase.from("raw_scrapes").select("*").eq("processed", false).order("scraped_at", { ascending: false }),
      supabase.from("promotions").select("*").eq("status", "review").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").in("status", ["queued", "sent", "error"]).order("created_at", { ascending: false }),
    ]);
    setScrapes(s.data ?? []);
    setReviewItems(r.data ?? []);
    setQueueItems(q.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const processPromotion = async (scrape: RawScrape) => {
    if (!user) return;
    setProcessing(scrape.id);
    const { error } = await supabase.from("promotions").insert({
      user_id: user.id,
      raw_scrape_id: scrape.id,
      product_name: scrape.product_name,
      product_image_url: scrape.product_image_url,
      original_price: scrape.original_price,
      promo_price: scrape.promo_price,
      product_url: scrape.product_url,
      status: "review",
    });
    if (!error) {
      await supabase.from("raw_scrapes").update({ processed: true }).eq("id", scrape.id);
    }
    setProcessing(null);
    fetchAll();
  };

  const updateAiMessage = async (id: string, ai_message: string) => {
    await supabase.from("promotions").update({ ai_message }).eq("id", id);
  };

  const moveToQueue = async (id: string) => {
    await supabase.from("promotions").update({ status: "queued" }).eq("id", id);
    fetchAll();
    toast({ title: "Movido para a fila de envio!" });
  };

  const markAsSent = async (id: string) => {
    await supabase.from("promotions").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
    fetchAll();
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const formatPrice = (price: number | null) => price != null ? `R$ ${price.toFixed(2)}` : "—";

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      queued: { label: "Pendente", className: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
      sent: { label: "Enviado", className: "bg-primary/20 text-primary border-primary/30" },
      error: { label: "Erro", className: "bg-destructive/20 text-destructive border-destructive/30" },
    };
    const s = map[status] ?? map.queued;
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline de Promoções</h1>
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">Novos Achados ({scrapes.length})</TabsTrigger>
          <TabsTrigger value="review">Revisão e IA ({reviewItems.length})</TabsTrigger>
          <TabsTrigger value="queue">Fila WhatsApp ({queueItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          {scrapes.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum produto novo encontrado.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scrapes.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  {s.product_image_url && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img src={s.product_image_url} alt={s.product_name} className="h-full w-full object-contain" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">{s.product_name}</h3>
                    <div className="flex items-center gap-2">
                      {s.original_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(s.original_price)}</span>}
                      <span className="text-lg font-bold text-primary">{formatPrice(s.promo_price)}</span>
                    </div>
                    <Button className="w-full" onClick={() => processPromotion(s)} disabled={processing === s.id}>
                      {processing === s.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Processar Promoção
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="review">
          {reviewItems.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma promoção em revisão.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {reviewItems.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="md:w-1/3 space-y-2">
                        {p.product_image_url && (
                          <div className="aspect-video overflow-hidden rounded-md bg-muted">
                            <img src={p.product_image_url} alt={p.product_name} className="h-full w-full object-contain" />
                          </div>
                        )}
                        <h3 className="font-semibold">{p.product_name}</h3>
                        <div className="flex items-center gap-2">
                          {p.original_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(p.original_price)}</span>}
                          <span className="text-lg font-bold text-primary">{formatPrice(p.promo_price)}</span>
                        </div>
                        {p.short_link_code && (
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-secondary">{p.short_link_code}</code>
                            <Button size="icon" variant="ghost" onClick={() => copyMessage(p.short_link_code!)}><Copy className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </div>
                      <div className="md:w-2/3 space-y-3">
                        <Textarea
                          placeholder="Mensagem gerada pela IA..."
                          value={p.ai_message ?? ""}
                          onChange={(e) => {
                            setReviewItems((prev) => prev.map((i) => i.id === p.id ? { ...i, ai_message: e.target.value } : i));
                            updateAiMessage(p.id, e.target.value);
                          }}
                          rows={6}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => copyMessage(p.ai_message ?? "")}><Copy className="mr-2 h-4 w-4" /> Copiar</Button>
                          <Button onClick={() => moveToQueue(p.id)}><Check className="mr-2 h-4 w-4" /> Aprovar e Enviar para Fila</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="queue">
          {queueItems.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Fila de envio vazia.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {queueItems.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.product_name}</span>
                        {statusBadge(p.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.ai_message}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => copyMessage(p.ai_message ?? "")}><Copy className="h-4 w-4" /></Button>
                      {p.status === "queued" && (
                        <Button size="sm" onClick={() => markAsSent(p.id)}><Send className="mr-1 h-4 w-4" /> Enviado</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
