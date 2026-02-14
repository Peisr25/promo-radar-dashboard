import { useEffect, useMemo, useState } from "react";
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
import {
  ScrapeFilters,
  type SortOption,
  type DiscountFilter,
  type PriceTypeFilter,
  type PriceRangeFilter,
} from "@/components/pipeline/ScrapeFilters";

type Promotion = Tables<"promotions">;

interface RawScrape {
  id: number;
  created_at: string;
  product_title: string | null;
  original_url: string | null;
  price: number | null;
  old_price: number | null;
  discount_percentage: string | null;
  rating: string | null;
  installments: string | null;
  price_type: string | null;
  image_url: string | null;
  source: string | null;
  status: string;
}

export default function Pipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scrapes, setScrapes] = useState<RawScrape[]>([]);
  const [reviewItems, setReviewItems] = useState<Promotion[]>([]);
  const [queueItems, setQueueItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  // Filter & sort state
  const [sortBy, setSortBy] = useState<SortOption>("discount");
  const [filterDiscount, setFilterDiscount] = useState<DiscountFilter>("all");
  const [filterPriceType, setFilterPriceType] = useState<PriceTypeFilter>("all");
  const [filterPriceRange, setFilterPriceRange] = useState<PriceRangeFilter>("all");

  const fetchAll = async () => {
    const [s, r, q] = await Promise.all([
      supabase.from("raw_scrapes").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").eq("status", "review").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").in("status", ["queued", "sent", "error"]).order("created_at", { ascending: false }),
    ]);
    setScrapes((s.data as RawScrape[]) ?? []);
    setReviewItems(r.data ?? []);
    setQueueItems(q.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const filteredScrapes = useMemo(() => {
    let filtered = [...scrapes];

    if (filterDiscount !== "all") {
      const min = parseInt(filterDiscount);
      filtered = filtered.filter(s => parseInt(s.discount_percentage ?? "0") >= min);
    }
    if (filterPriceType !== "all") {
      filtered = filtered.filter(s => s.price_type === filterPriceType);
    }
    if (filterPriceRange !== "all") {
      filtered = filtered.filter(s => {
        const p = s.price ?? 0;
        switch (filterPriceRange) {
          case "0-50": return p <= 50;
          case "50-100": return p > 50 && p <= 100;
          case "100-500": return p > 100 && p <= 500;
          case "500+": return p > 500;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "discount":
          return parseInt(b.discount_percentage ?? "0") - parseInt(a.discount_percentage ?? "0");
        case "price":
          return (a.price ?? 0) - (b.price ?? 0);
        case "rating":
          return parseFloat(b.rating ?? "0") - parseFloat(a.rating ?? "0");
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "savings":
          return ((b.old_price ?? 0) - (b.price ?? 0)) - ((a.old_price ?? 0) - (a.price ?? 0));
        default:
          return 0;
      }
    });

    return filtered;
  }, [scrapes, sortBy, filterDiscount, filterPriceType, filterPriceRange]);

  const processPromotion = async (scrape: RawScrape) => {
    if (!user) return;
    setProcessing(scrape.id);
    const { error } = await supabase.from("promotions").insert({
      user_id: user.id,
      product_name: scrape.product_title ?? "Sem título",
      product_image_url: scrape.image_url,
      promo_price: scrape.price,
      original_price: scrape.old_price,
      product_url: scrape.original_url,
      status: "review",
    });
    if (!error) {
      await supabase.from("raw_scrapes").update({ status: "processed" }).eq("id", scrape.id);
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
          <ScrapeFilters
            sortBy={sortBy} onSortChange={setSortBy}
            filterDiscount={filterDiscount} onFilterDiscountChange={setFilterDiscount}
            filterPriceType={filterPriceType} onFilterPriceTypeChange={setFilterPriceType}
            filterPriceRange={filterPriceRange} onFilterPriceRangeChange={setFilterPriceRange}
            filteredCount={filteredScrapes.length} totalCount={scrapes.length}
          />

          {filteredScrapes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {scrapes.length === 0
                  ? "Nenhum produto novo encontrado."
                  : "Nenhum produto corresponde aos filtros selecionados."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredScrapes.map((s, index) => (
                <Card key={s.id} className="overflow-hidden">
                  {sortBy === "discount" && index < 3 && (
                    <div className="bg-primary/10 text-primary text-xs font-bold text-center py-1">
                      🔥 TOP {index + 1} DESCONTO
                    </div>
                  )}
                  {s.image_url && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img src={s.image_url} alt={s.product_title ?? ""} className="h-full w-full object-contain" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">{s.product_title ?? "Sem título"}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.old_price != null && (
                        <span className="text-sm text-muted-foreground line-through">R$ {Number(s.old_price).toFixed(2)}</span>
                      )}
                      <span className="text-lg font-bold text-primary">{formatPrice(s.price)}</span>
                      {s.discount_percentage && (
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">-{s.discount_percentage}%</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {s.rating && <span className="flex items-center gap-1">⭐ {s.rating}</span>}
                      {s.price_type && <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground border-secondary/30">{s.price_type}</Badge>}
                    </div>
                    {s.installments && (
                      <p className="text-xs text-muted-foreground">{s.installments}</p>
                    )}
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
