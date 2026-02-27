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
import { Input } from "@/components/ui/input";
import { Bot, Plus, Trash2, Percent, MessageCircle, Play, Loader2, Square, Settings2, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { AutomationRuleModal } from "@/components/automations/AutomationRuleModal";
import { AutomationActivityLog } from "@/components/automations/AutomationActivityLog";

const ALL_CATEGORIES_TOKEN = "__all__";

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

interface MotorControl {
  id: string;
  is_running: boolean;
  max_messages_per_hour: number | null;
  max_messages_per_day: number | null;
  delay_between_messages: number | null;
  last_run_at: string | null;
  last_run_sent: number | null;
  last_run_errors: number | null;
  last_run_skipped: number | null;
}

export default function Automations() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [limitPerHour, setLimitPerHour] = useState("");
  const [limitPerDay, setLimitPerDay] = useState("");
  const [delayBetween, setDelayBetween] = useState("8");

  // Query motor_control to know if engine is running + settings
  const { data: motorControl } = useQuery({
    queryKey: ["motor_control"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motor_control")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as MotorControl | null;
    },
    enabled: !!session,
    refetchInterval: 3000,
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
      // Upsert motor_control to is_running = true (otimista — Railway também seta)
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

      // Chama o Motor no Railway (FastAPI) em vez da Edge Function
      const RAILWAY_URL = import.meta.env.VITE_RAILWAY_MOTOR_URL || "https://fast-api-scrapers-radar-production.up.railway.app";
      const token = session?.access_token;

      const res = await fetch(`${RAILWAY_URL}/api/process-automations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Erro de rede" }));
        throw new Error(errBody.detail || errBody.error || `HTTP ${res.status}`);
      }

      // Railway retorna 202 — o motor roda em background
      return await res.json() as { status: string; message: string };
    },
    onSuccess: () => {
      toast({
        title: "Motor iniciado",
        description: "Processamento rodando em background no servidor. Acompanhe pelo log abaixo.",
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

  const saveLimitsMutation = useMutation({
    mutationFn: async () => {
      const perHour = limitPerHour ? parseInt(limitPerHour, 10) : 0;
      const perDay = limitPerDay ? parseInt(limitPerDay, 10) : 0;
      const delay = delayBetween ? parseInt(delayBetween, 10) : 8;

      const { data: existing } = await supabase
        .from("motor_control")
        .select("id")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("motor_control").update({
          max_messages_per_hour: perHour,
          max_messages_per_day: perDay,
          delay_between_messages: delay,
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("motor_control").insert({
          user_id: session!.user.id,
          max_messages_per_hour: perHour,
          max_messages_per_day: perDay,
          delay_between_messages: delay,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motor_control"] });
      toast({ title: "Limites atualizados!" });
      setSettingsOpen(false);
    },
    onError: () => toast({ title: "Erro ao salvar limites", variant: "destructive" }),
  });

  const handleOpenSettings = () => {
    setLimitPerHour(String(motorControl?.max_messages_per_hour ?? 0));
    setLimitPerDay(String(motorControl?.max_messages_per_day ?? 0));
    setDelayBetween(String(motorControl?.delay_between_messages ?? 8));
    setSettingsOpen(!settingsOpen);
  };

  const modeLabel = (mode: string) =>
    mode === "urubu_padrao" ? "🦅 Modo Urubu" : "🎯 Personalizado";

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSettings}
            title="Configurações do Motor"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
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

      {/* Motor Settings Panel */}
      {settingsOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Configurações do Motor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Limite por Hora</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0 = sem limite"
                  value={limitPerHour}
                  onChange={(e) => setLimitPerHour(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Máx. de mensagens enviadas por hora. 0 = ilimitado.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Limite por Dia</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0 = sem limite"
                  value={limitPerDay}
                  onChange={(e) => setLimitPerDay(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Máx. de mensagens enviadas por dia. 0 = ilimitado.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Delay entre Mensagens</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="8"
                  value={delayBetween}
                  onChange={(e) => setDelayBetween(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Segundos entre cada envio (anti-spam).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => saveLimitsMutation.mutate()}
                disabled={saveLimitsMutation.isPending}
              >
                {saveLimitsMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Salvar Limites
              </Button>
              <span className="text-xs text-muted-foreground">
                Atual: {motorControl?.max_messages_per_hour || "∞"}/h, {motorControl?.max_messages_per_day || "∞"}/dia, {motorControl?.delay_between_messages ?? 8}s delay
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Run Summary */}
      {motorControl?.last_run_at && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Última execução: {formatLastRun(motorControl.last_run_at)}
              </span>
              {motorControl.last_run_sent != null && motorControl.last_run_sent > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {motorControl.last_run_sent} enviado(s)
                </span>
              )}
              {motorControl.last_run_skipped != null && motorControl.last_run_skipped > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  {motorControl.last_run_skipped} ignorado(s)
                </span>
              )}
              {motorControl.last_run_errors != null && motorControl.last_run_errors > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {motorControl.last_run_errors} erro(s)
                </span>
              )}
              {(motorControl.max_messages_per_hour || motorControl.max_messages_per_day) ? (
                <Badge variant="outline" className="text-xs">
                  Limites: {motorControl.max_messages_per_hour || "∞"}/h, {motorControl.max_messages_per_day || "∞"}/dia
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

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
                {rule.categories.includes(ALL_CATEGORIES_TOKEN) ? (
                  <Badge variant="default" className="text-xs">
                    Todas as Categorias
                  </Badge>
                ) : (
                  rule.categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))
                )}
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
