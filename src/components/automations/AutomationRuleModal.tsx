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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  categories: z.array(z.string()).min(1, "Selecione ao menos 1 categoria"),
  min_discount: z.number().min(0).max(100),
  target_group_id: z.string().min(1, "Selecione um grupo"),
  ai_mode: z.enum(["urubu_padrao", "customizado"]),
  highlight_discount: z.boolean(),
  highlight_installments: z.boolean(),
  highlight_open_box: z.boolean(),
  highlight_urgency: z.boolean(),
  tone: z.enum(["funny", "direct", "aggressive"]),
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
      target_group_id: "",
      ai_mode: "urubu_padrao",
      highlight_discount: false,
      highlight_installments: false,
      highlight_open_box: false,
      highlight_urgency: false,
      tone: "funny",
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  // Fetch distinct categories from raw_scrapes metadata
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

  // Fetch user's whatsapp groups
  const { data: groups } = useQuery({
    queryKey: ["whatsapp_groups_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("id, group_name")
        .order("group_name");
      if (error) throw error;
      return data;
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

      const { error } = await supabase.from("automation_rules").insert({
        user_id: session!.user.id,
        name: values.name,
        categories: values.categories,
        min_discount: values.min_discount,
        target_group_id: values.target_group_id,
        ai_mode: values.ai_mode,
        custom_ai_options,
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
  const aiMode = form.watch("ai_mode");

  const toggleCategory = (cat: string) => {
    const current = form.getValues("categories");
    form.setValue(
      "categories",
      current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat],
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

            {/* Categories */}
            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
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

            {/* Target Group */}
            <FormField
              control={form.control}
              name="target_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo de Destino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.group_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <Checkbox
                          checked={form.watch("highlight_discount")}
                          onCheckedChange={(v) => form.setValue("highlight_discount", !!v)}
                        />
                        <span className="text-sm">Destacar % de Desconto</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={form.watch("highlight_installments")}
                          onCheckedChange={(v) => form.setValue("highlight_installments", !!v)}
                        />
                        <span className="text-sm">Destacar Parcelamento</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={form.watch("highlight_open_box")}
                          onCheckedChange={(v) => form.setValue("highlight_open_box", !!v)}
                        />
                        <span className="text-sm">Aviso de Open Box</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={form.watch("highlight_urgency")}
                          onCheckedChange={(v) => form.setValue("highlight_urgency", !!v)}
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
