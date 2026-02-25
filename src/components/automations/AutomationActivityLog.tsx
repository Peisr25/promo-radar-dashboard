import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Clock, SkipForward, XCircle, Activity,
  Play, Square, AlertTriangle, Zap, Send,
} from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";

interface AutomationLog {
  id: string;
  rule_id: string | null;
  scrape_id: number | null;
  status: string;
  message: string;
  metadata: Record<string, unknown> | null;
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

function getLogIcon(log: AutomationLog) {
  const meta = log.metadata;
  const metaType = meta?.type as string | undefined;

  if (metaType === "motor_start") return { icon: Play, color: "text-blue-500" };
  if (metaType === "motor_end") return { icon: Square, color: "text-indigo-500" };
  if (metaType === "motor_crash") return { icon: AlertTriangle, color: "text-destructive" };
  if (metaType === "motor_paused") return { icon: Square, color: "text-yellow-500" };
  if (metaType === "rate_limit") return { icon: AlertTriangle, color: "text-orange-500" };
  if (metaType === "sent") return { icon: Send, color: "text-green-500" };
  if (metaType === "processing") return { icon: Zap, color: "text-blue-500" };

  const config = statusConfig[log.status] ?? statusConfig.processing;
  return { icon: config.icon, color: config.color };
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return `Hoje às ${format(date, "HH:mm:ss")}`;
  if (isYesterday(date)) return `Ontem às ${format(date, "HH:mm")}`;
  return format(date, "dd/MM HH:mm");
}

function isMotorEvent(log: AutomationLog): boolean {
  const metaType = (log.metadata?.type as string) ?? "";
  return ["motor_start", "motor_end", "motor_crash", "motor_paused", "rate_limit"].includes(metaType);
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
        .limit(80);
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
          event: "*",
          schema: "public",
          table: "automation_logs",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRealtimeLogs((prev) => [payload.new as AutomationLog, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as AutomationLog;
            setRealtimeLogs((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Merge realtime with initial, deduplicate by id
  const seenIds = new Set<string>();
  const allLogs: AutomationLog[] = [];
  for (const log of [...realtimeLogs, ...(initialLogs ?? [])]) {
    if (!seenIds.has(log.id)) {
      seenIds.add(log.id);
      allLogs.push(log);
    }
  }

  if (allLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registada ainda.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-0.5 pr-4">
        {allLogs.map((log) => {
          const { icon: Icon, color } = getLogIcon(log);
          const ruleName = log.rule_id ? ruleNameMap.get(log.rule_id) : null;
          const isMotor = isMotorEvent(log);
          const meta = log.metadata;

          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 rounded-md px-3 py-2 transition-colors ${
                isMotor
                  ? "bg-muted/30 border-l-2 border-muted-foreground/20"
                  : "hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isMotor ? "font-medium" : ""} text-foreground`}>
                  {log.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {ruleName && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ruleName}
                    </Badge>
                  )}
                  {meta?.categoria && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {meta.categoria as string}
                    </Badge>
                  )}
                  {meta?.discount != null && !isMotor && (
                    <span className="text-[10px] text-green-600 font-medium">
                      -{meta.discount as number}%
                    </span>
                  )}
                  {meta?.group_name && (
                    <span className="text-[10px] text-muted-foreground">
                      → {meta.group_name as string}
                    </span>
                  )}
                  {meta?.duration_seconds != null && (
                    <span className="text-[10px] text-muted-foreground">
                      ({meta.duration_seconds as number}s)
                    </span>
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
