import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, SkipForward, XCircle, Activity } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";

interface AutomationLog {
  id: string;
  rule_id: string | null;
  scrape_id: number | null;
  status: string;
  message: string;
  created_at: string;
}

interface AutomationActivityLogProps {
  ruleNameMap: Map<string, string>;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-green-500", label: "Sucesso" },
  processing: { icon: Clock, color: "text-blue-500", label: "Processando" },
  skipped: { icon: SkipForward, color: "text-yellow-500", label: "Ignorado" },
  error: { icon: XCircle, color: "text-destructive", label: "Erro" },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return `Hoje às ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Ontem às ${format(date, "HH:mm")}`;
  return format(date, "dd/MM HH:mm");
}

export function AutomationActivityLog({ ruleNameMap }: AutomationActivityLogProps) {
  const { session } = useAuth();
  const [realtimeLogs, setRealtimeLogs] = useState<AutomationLog[]>([]);

  const { data: initialLogs } = useQuery({
    queryKey: ["automation_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AutomationLog[];
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("automation-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "automation_logs",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setRealtimeLogs((prev) => [payload.new as AutomationLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const logs = [...realtimeLogs, ...(initialLogs ?? [])];

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registada ainda.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px]">
      <div className="space-y-1 pr-4">
        {logs.map((log) => {
          const config = statusConfig[log.status] ?? statusConfig.processing;
          const Icon = config.icon;
          const ruleName = log.rule_id ? ruleNameMap.get(log.rule_id) : null;

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{log.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {ruleName && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ruleName}
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {formatTime(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
