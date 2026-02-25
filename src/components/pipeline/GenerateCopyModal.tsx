import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { shortenLink } from "@/lib/link-shortener";

interface ProductData {
  id: number;
  product_title: string | null;
  price: number | null;
  old_price: number | null;
  discount_percentage: string | null;
  rating: string | null;
  installments: string | null;
  price_type: string | null;
  original_url: string | null;
  image_url: string | null;
  metadata: {
    categoria?: string;
    is_buy_box?: boolean;
    [key: string]: unknown;
  } | null;
}

interface GenerateCopyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductData | null;
}

type Tone = "funny" | "direct" | "aggressive";

const toneLabels: Record<Tone, string> = {
  funny: "Engraçado",
  direct: "Direto/Sério",
  aggressive: "Agressivo/Urgente",
};

export function GenerateCopyModal({ open, onOpenChange, product }: GenerateCopyModalProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Custom mode state
  const [highlightDiscount, setHighlightDiscount] = useState(false);
  const [highlightInstallments, setHighlightInstallments] = useState(false);
  const [highlightOpenBox, setHighlightOpenBox] = useState(false);
  const [highlightUrgency, setHighlightUrgency] = useState(false);
  const [tone, setTone] = useState<Tone>("funny");

  const resetState = () => {
    setGeneratedMessage("");
    setCopied(false);
  };

  const handleGenerate = async (mode: "default" | "custom") => {
    if (!product) return;
    setGenerating(true);
    setGeneratedMessage("");
    setCopied(false);

    try {
      // Shorten URL first
      let finalUrl = product.original_url ?? "";
      if (finalUrl) {
        const { shortUrl, error: linkError } = await shortenLink({
          originalUrl: finalUrl,
          productTitle: product.product_title ?? undefined,
        });
        if (linkError) {
          toast({ title: "Erro ao encurtar link", description: linkError, variant: "destructive" });
        } else {
          finalUrl = shortUrl;
        }
      }

      const body: Record<string, unknown> = {
        product_title: product.product_title ?? "Sem título",
        price: product.price ?? 0,
        old_price: product.old_price,
        discount_percentage: product.discount_percentage,
        rating: product.rating,
        installments: product.installments,
        price_type: product.price_type,
        original_url: finalUrl,
        mode,
      };

      if (mode === "custom") {
        body.highlight_discount = highlightDiscount;
        body.highlight_installments = highlightInstallments;
        body.highlight_open_box = highlightOpenBox;
        body.highlight_urgency = highlightUrgency;
        body.tone = tone;
        body.is_buy_box = product.metadata?.is_buy_box ?? false;
      }

      const { data, error } = await supabase.functions.invoke("generate-promo-message", { body });

      if (error) {
        toast({ title: "Erro ao gerar", description: error.message, variant: "destructive" });
        setGenerating(false);
        return;
      }

      if (data?.fallback) {
        toast({ title: "⚠️ Aviso", description: "Título criativo indisponível, usado fallback.", variant: "destructive" });
      }

      setGeneratedMessage(data?.message ?? "");
    } catch (e) {
      toast({ title: "Erro inesperado", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (p: number | null) => (p != null ? `R$ ${p.toFixed(2)}` : "—");

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Copy com IA</DialogTitle>
          <DialogDescription className="line-clamp-2">{product.product_title}</DialogDescription>
        </DialogHeader>

        {/* Product summary */}
        <div className="flex items-center gap-3 rounded-md bg-muted p-3">
          {product.image_url && (
            <img src={product.image_url} alt="" className="h-14 w-14 rounded object-contain bg-background" />
          )}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
              {product.old_price != null && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(product.old_price)}</span>
              )}
              {product.discount_percentage && (
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-xs">
                  -{product.discount_percentage}%
                </Badge>
              )}
            </div>
            {product.installments && <p className="text-xs text-muted-foreground truncate">{product.installments}</p>}
          </div>
        </div>

        <Tabs defaultValue="default" onValueChange={() => { setGeneratedMessage(""); setCopied(false); }}>
          <TabsList className="w-full">
            <TabsTrigger value="default" className="flex-1">🦅 Modo Urubu</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">🎯 Personalizado</TabsTrigger>
          </TabsList>

          {/* Default (Urubu) Tab */}
          <TabsContent value="default" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">
              Gera uma mensagem com humor irónico no estilo "Urubu das Promoções".
            </p>
            <Button className="w-full" onClick={() => handleGenerate("default")} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar Mensagem
            </Button>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="space-y-4 mt-3">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={highlightDiscount} onCheckedChange={(v) => setHighlightDiscount(!!v)} />
                <span className="text-sm">Destacar % de Desconto</span>
                {product.discount_percentage && (
                  <Badge variant="secondary" className="text-xs ml-auto">-{product.discount_percentage}%</Badge>
                )}
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={highlightInstallments} onCheckedChange={(v) => setHighlightInstallments(!!v)} />
                <span className="text-sm">Destacar Parcelamento</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={highlightOpenBox} onCheckedChange={(v) => setHighlightOpenBox(!!v)} />
                <span className="text-sm">Aviso de Open Box</span>
                {product.metadata?.is_buy_box && (
                  <Badge variant="destructive" className="text-xs ml-auto">📦 Open Box</Badge>
                )}
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={highlightUrgency} onCheckedChange={(v) => setHighlightUrgency(!!v)} />
                <span className="text-sm">Criar Urgência (Poucas unidades)</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tom de Voz</label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(toneLabels) as [Tone, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => handleGenerate("custom")} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar Mensagem Personalizada
            </Button>
          </TabsContent>
        </Tabs>

        {/* Result area */}
        {generating && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {generatedMessage && !generating && (
          <div className="space-y-2">
            <Textarea value={generatedMessage} onChange={(e) => setGeneratedMessage(e.target.value)} rows={8} />
            <Button variant="outline" className="w-full" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copiado!" : "Copiar para a Área de Transferência"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
