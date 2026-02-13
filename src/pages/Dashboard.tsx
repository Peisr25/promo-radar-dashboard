import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Link2, MousePointerClick, MessageCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ scrapes: 0, links: 0, clicks: 0, sent: 0 });
  const [chartData, setChartData] = useState<{ date: string; clicks: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchKpis = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [scrapes, links, clicks, sent] = await Promise.all([
        supabase.from("raw_scrapes").select("id", { count: "exact", head: true }).gte("scraped_at", today),
        supabase.from("short_links").select("id", { count: "exact", head: true }),
        supabase.from("click_logs").select("id", { count: "exact", head: true }),
        supabase.from("promotions").select("id", { count: "exact", head: true }).eq("status", "sent"),
      ]);

      setKpis({
        scrapes: scrapes.count ?? 0,
        links: links.count ?? 0,
        clicks: clicks.count ?? 0,
        sent: sent.count ?? 0,
      });
    };

    const fetchChart = async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const { data } = await supabase
        .from("click_logs")
        .select("clicked_at")
        .gte("clicked_at", days[0]);

      const counts: Record<string, number> = {};
      days.forEach((d) => (counts[d] = 0));
      data?.forEach((log) => {
        const day = log.clicked_at.split("T")[0];
        if (counts[day] !== undefined) counts[day]++;
      });

      setChartData(days.map((d) => ({ date: d.slice(5), clicks: counts[d] })));
    };

    fetchKpis();
    fetchChart();
  }, [user]);

  const kpiCards = [
    { title: "Raspadas (Hoje)", value: kpis.scrapes, icon: Package, color: "text-primary" },
    { title: "Links Encurtados", value: kpis.links, icon: Link2, color: "text-secondary" },
    { title: "Total de Cliques", value: kpis.clicks, icon: MousePointerClick, color: "text-chart-3" },
    { title: "Mensagens Enviadas", value: kpis.sent, icon: MessageCircle, color: "text-chart-4" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cliques — Últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
