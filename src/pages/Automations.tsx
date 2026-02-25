import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Plus, Trash2, Percent, MessageCircle, Play, Loader2, Square } from "lucide-react";
import { AutomationRuleModal } from "@/components/automations/AutomationRuleModal";
import { AutomationActivityLog } from "@/components/automations/AutomationActivityLog";

interface AutomationRule {
  id: string;
  name: string;
  categories: string[];
  min_discount: number;
  target_group_id: string;
  ai_mode: string;
  custom_ai_options: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export default function Automations() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Query motor_control to know if engine is running
  const { data: motorControl } = useQuery({
    queryKey: ["motor_control"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motor_control")
        .select("is_running")
        .maybeSingle();
      if (error) throw error;
      return data as { is_running: boolean } | null;
    },
    enabled: !!session,
    refetchInterval: 3000, // poll every 3s while page is open
  });

  const isMotorRunning = motorControl?.is_running ?? false;

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutomationRule[];
    },
    enabled: !!session,
  });

  const { data: groups } = useQuery({
    queryKey: ["whatsapp_groups_map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("id, group_name, group_id");
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const groupNameMap = new Map(groups?.map((g) => [g.id, g.group_name]) ?? []);
  const ruleNameMap = new Map(rules?.map((r) => [r.id, r.name]) ?? []);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation_rules"] }),
    onError: () => toast({ title: "Erro ao atualizar regra", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast({ title: "Regra excluída" });
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const runEngineMutation = useMutation({
    mutationFn: async () => {
      // Upsert motor_control to is_running = true
      const { data: existing } = await supabase
        .from("motor_control")
        .select("id")
        .maybeSingle();

      if (existing) {
        await supabase.from("motor_control").update({ is_running: true }).eq("id", existing.id);
      } else {
        await supabase.from("motor_control").insert({ is_running: true, user_id: session!.user.id });
      }

      queryClient.invalidateQueries({ queryKey: ["motor_control"] });

      const { data, error } = await supabase.functions.invoke("process-automations", {
        body: {},
      });
      if (error) throw error;
      return data as { processed: number; sent: number; errors: number; skipped: number };
    },
    onSuccess: (data) => {
      toast({
        title: "Motor executado",
        description: `${data.sent} enviados, ${data.skipped} ignorados, ${data.errors} erros.`,
      });
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      queryClient.invalidateQueries({ queryKey: ["automation_logs"] });
      queryClient.invalidateQueries({ queryKey: ["motor_control"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro ao executar motor", description: msg, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["motor_control"] });
    },
  });

  const handleStop = async () => {
    try {
      const { data: existing } = await supabase
        .from("motor_control")
        .select("id")
        .maybeSingle();

      if (existing) {
        await supabase.from("motor_control").update({ is_running: false }).eq("id", existing.id);
      }

      queryClient.invalidateQueries({ queryKey: ["motor_control"] });
      toast({ title: "Solicitação de parada enviada", description: "O motor irá parar na próxima iteração." });
    } catch {
      toast({ title: "Erro ao parar motor", variant: "destructive" });
    }
  };

  const modeLabel = (mode: string) =>
    mode === "urubu_padrao" ? "🦅 Modo Urubu" : "🎯 Personalizado";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground text-sm">
            Regras de envio automático para grupos do WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          {isMotorRunning || runEngineMutation.isPending ? (
            <Button
              variant="destructive"
              onClick={handleStop}
            >
              <Square className="mr-2 h-4 w-4" />
              Pausar Motor
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => runEngineMutation.mutate()}
              disabled={runEngineMutation.isPending}
            >
              {runEngineMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Executar Motor Agora
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Automação
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!rules || rules.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhuma automação criada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma regra para rotear promoções automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rules?.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{rule.name}</CardTitle>
              <Switch
                checked={rule.is_active}
                onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, is_active: v })}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {rule.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" />
                  ≥ {rule.min_discount}%
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {groupNameMap.get(rule.target_group_id) ?? rule.target_group_id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {modeLabel(rule.ai_mode)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Log de Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <AutomationActivityLog ruleNameMap={ruleNameMap} />
        </CardContent>
      </Card>

      <AutomationRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
