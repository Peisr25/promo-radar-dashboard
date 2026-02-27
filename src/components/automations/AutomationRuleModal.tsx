import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

const ALL_CATEGORIES_TOKEN = "__all__";

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  categories: z.array(z.string()).min(1, "Selecione ao menos 1 categoria"),
  min_discount: z.number().min(0).max(100),
  target_categories: z.array(z.string()).min(1, "Selecione ao menos 1 nicho"),
  ai_mode: z.enum(["urubu_padrao", "customizado"]),
  highlight_discount: z.boolean(),
  highlight_installments: z.boolean(),
  highlight_open_box: z.boolean(),
  highlight_urgency: z.boolean(),
  tone: z.enum(["funny", "direct", "aggressive"]),
  // message_config fields
  msg_tone: z.enum(["urgente", "amigavel", "profissional"]),
  msg_copy_length: z.enum(["curta", "detalhada"]),
  msg_emoji_level: z.enum(["alta", "moderada", "baixa"]),
  msg_show_installments: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const toneLabels: Record<string, string> = {
  funny: "Engraçado",
  direct: "Direto/Sério",
  aggressive: "Agressivo/Urgente",
};

interface AutomationRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationRuleModal({ open, onOpenChange }: AutomationRuleModalProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      categories: [],
      min_discount: 0,
      target_categories: [],
      ai_mode: "urubu_padrao",
      highlight_discount: false,
      highlight_installments: false,
      highlight_open_box: false,
      highlight_urgency: false,
      tone: "funny",
      msg_tone: "urgente",
      msg_copy_length: "curta",
      msg_emoji_level: "alta",
      msg_show_installments: true,
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  // Fetch distinct categories from raw_scrapes metadata (product categories)
  const { data: categories } = useQuery({
    queryKey: ["raw_scrapes_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_scrapes")
        .select("metadata")
        .not("metadata", "is", null);
      if (error) throw error;

      const cats = new Set<string>();
      data?.forEach((row) => {
        const meta = row.metadata as Record<string, unknown> | null;
        if (meta?.categoria && typeof meta.categoria === "string") {
          cats.add(meta.categoria);
        }
      });
      return Array.from(cats).sort();
    },
    enabled: open,
  });

  // Fetch distinct group niches (categories from whatsapp_groups)
  const { data: groupNiches } = useQuery({
    queryKey: ["whatsapp_group_niches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("categories");
      if (error) throw error;

      const niches = new Set<string>();
      data?.forEach((row) => {
        const cats = row.categories as string[] | null;
        cats?.forEach((c) => { if (c) niches.add(c); });
      });
      return Array.from(niches).sort();
    },
    enabled: open && !!session,
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const custom_ai_options =
        values.ai_mode === "customizado"
          ? {
              highlight_discount: values.highlight_discount,
              highlight_installments: values.highlight_installments,
              highlight_open_box: values.highlight_open_box,
              highlight_urgency: values.highlight_urgency,
              tone: values.tone,
            }
          : {};

      const message_config = {
        tone: values.msg_tone,
        copy_length: values.msg_copy_length,
        emoji_level: values.msg_emoji_level,
        show_installments: values.msg_show_installments,
      };

      const { error } = await supabase.from("automation_rules").insert({
        user_id: session!.user.id,
        name: values.name,
        categories: values.categories,
        min_discount: values.min_discount,
        target_categories: values.target_categories,
        ai_mode: values.ai_mode,
        custom_ai_options,
        message_config,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast({ title: "Automação criada com sucesso!" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Erro ao criar automação", variant: "destructive" }),
  });

  const selectedCategories = form.watch("categories");
  const selectedNiches = form.watch("target_categories");
  const aiMode = form.watch("ai_mode");
  const isAllCategories = selectedCategories.includes(ALL_CATEGORIES_TOKEN);
  const isAllNiches = selectedNiches.includes(ALL_CATEGORIES_TOKEN);

  const toggleAllCategories = () => {
    if (isAllCategories) {
      form.setValue("categories", [], { shouldValidate: true });
    } else {
      form.setValue("categories", [ALL_CATEGORIES_TOKEN], { shouldValidate: true });
    }
  };

  const toggleCategory = (cat: string) => {
    const current = form.getValues("categories").filter((c) => c !== ALL_CATEGORIES_TOKEN);
    form.setValue(
      "categories",
      current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat],
      { shouldValidate: true }
    );
  };

  const toggleAllNiches = () => {
    if (isAllNiches) {
      form.setValue("target_categories", [], { shouldValidate: true });
    } else {
      form.setValue("target_categories", [ALL_CATEGORIES_TOKEN], { shouldValidate: true });
    }
  };

  const toggleNiche = (niche: string) => {
    const current = form.getValues("target_categories").filter((c) => c !== ALL_CATEGORIES_TOKEN);
    form.setValue(
      "target_categories",
      current.includes(niche) ? current.filter((c) => c !== niche) : [...current, niche],
      { shouldValidate: true }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
          <DialogDescription>
            Defina uma regra para enviar promoções automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-5">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra</FormLabel>
                  <FormControl>
                    <Input placeholder='Ex: "Eletrônicos VIP"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Categories */}
            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormLabel>Categorias de Produto</FormLabel>
                  <div className="space-y-2">
                    <Badge
                      variant={isAllCategories ? "default" : "outline"}
                      className="cursor-pointer select-none text-sm px-3 py-1"
                      onClick={toggleAllCategories}
                    >
                      Todas as Categorias
                    </Badge>
                    {!isAllCategories && (
                      <div className="flex flex-wrap gap-2 rounded-md border border-input p-3 min-h-[44px]">
                        {categories && categories.length > 0 ? (
                          categories.map((cat) => (
                            <Badge
                              key={cat}
                              variant={selectedCategories.includes(cat) ? "default" : "outline"}
                              className="cursor-pointer select-none"
                              onClick={() => toggleCategory(cat)}
                            >
                              {cat}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Nenhuma categoria encontrada
                          </span>
                        )}
                      </div>
                    )}
                    {isAllCategories && (
                      <p className="text-xs text-muted-foreground">
                        A regra vai processar produtos de qualquer categoria.
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Min Discount */}
            <FormField
              control={form.control}
              name="min_discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Mínimo: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Niches (Broadcast) */}
            <FormField
              control={form.control}
              name="target_categories"
              render={() => (
                <FormItem>
                  <FormLabel>📡 Nichos Alvo (Broadcast)</FormLabel>
                  <div className="space-y-2">
                    <Badge
                      variant={isAllNiches ? "default" : "outline"}
                      className="cursor-pointer select-none text-sm px-3 py-1"
                      onClick={toggleAllNiches}
                    >
                      Todos os Nichos
                    </Badge>
                    {!isAllNiches && (
                      <div className="flex flex-wrap gap-2 rounded-md border border-input p-3 min-h-[44px]">
                        {groupNiches && groupNiches.length > 0 ? (
                          groupNiches.map((niche) => (
                            <Badge
                              key={niche}
                              variant={selectedNiches.includes(niche) ? "default" : "outline"}
                              className="cursor-pointer select-none"
                              onClick={() => toggleNiche(niche)}
                            >
                              {niche}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Nenhum nicho encontrado nos grupos
                          </span>
                        )}
                      </div>
                    )}
                    {isAllNiches && (
                      <p className="text-xs text-muted-foreground">
                        A mensagem será enviada para todos os grupos ativos.
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Config Accordion */}
            <Accordion type="single" collapsible>
              <AccordionItem value="message-config">
                <AccordionTrigger className="text-sm font-medium">
                  ⚙️ Configuração da Mensagem (Copy)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Tone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tom de Voz</label>
                    <Select
                      value={form.watch("msg_tone")}
                      onValueChange={(v) => form.setValue("msg_tone", v as "urgente" | "amigavel" | "profissional")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">🔥 Urgente (Escassez/Bug)</SelectItem>
                        <SelectItem value="amigavel">😊 Amigável (Descontraído)</SelectItem>
                        <SelectItem value="profissional">💼 Profissional (Direto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Copy Length */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tamanho da Copy</label>
                    <Select
                      value={form.watch("msg_copy_length")}
                      onValueChange={(v) => form.setValue("msg_copy_length", v as "curta" | "detalhada")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curta">⚡ Curta (Impacto Rápido)</SelectItem>
                        <SelectItem value="detalhada">📝 Detalhada (Com especificações)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emoji Level */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Quantidade de Emojis</label>
                    <Select
                      value={form.watch("msg_emoji_level")}
                      onValueChange={(v) => form.setValue("msg_emoji_level", v as "alta" | "moderada" | "baixa")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">🎉 Alta</SelectItem>
                        <SelectItem value="moderada">👍 Moderada</SelectItem>
                        <SelectItem value="baixa">🔇 Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show Installments */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Destacar Parcelamento</label>
                    <Switch
                      checked={form.watch("msg_show_installments")}
                      onCheckedChange={(v) => form.setValue("msg_show_installments", v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* AI Mode */}
            <FormField
              control={form.control}
              name="ai_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuração da Copy (IA)</FormLabel>
                  <Tabs value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <TabsList className="w-full">
                      <TabsTrigger value="urubu_padrao" className="flex-1">
                        🦅 Modo Urubu
                      </TabsTrigger>
                      <TabsTrigger value="customizado" className="flex-1">
                        🎯 Personalizado
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="urubu_padrao" className="mt-3">
                      <p className="text-sm text-muted-foreground">
                        Usa o estilo padrão "Urubu das Promoções" com humor irónico.
                      </p>
                    </TabsContent>

                    <TabsContent value="customizado" className="space-y-3 mt-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4"
                          checked={form.watch("highlight_discount")}
                          onChange={(e) => form.setValue("highlight_discount", e.target.checked)}
                        />
                        <span className="text-sm">Destacar % de Desconto</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4"
                          checked={form.watch("highlight_installments")}
                          onChange={(e) => form.setValue("highlight_installments", e.target.checked)}
                        />
                        <span className="text-sm">Destacar Parcelamento</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4"
                          checked={form.watch("highlight_open_box")}
                          onChange={(e) => form.setValue("highlight_open_box", e.target.checked)}
                        />
                        <span className="text-sm">Aviso de Open Box</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4"
                          checked={form.watch("highlight_urgency")}
                          onChange={(e) => form.setValue("highlight_urgency", e.target.checked)}
                        />
                        <span className="text-sm">Criar Urgência</span>
                      </label>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Tom de Voz</label>
                        <Select
                          value={form.watch("tone")}
                          onValueChange={(v) => form.setValue("tone", v as "funny" | "direct" | "aggressive")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(toneLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Automação
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
