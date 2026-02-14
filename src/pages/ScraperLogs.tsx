import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ExternalLink } from "lucide-react";

interface RawScrape {
  id: number;
  created_at: string;
  product_title: string | null;
  original_url: string | null;
  price: number | null;
  image_url: string | null;
  source: string | null;
  status: string;
}

export default function ScraperLogs() {
  const [logs, setLogs] = useState<RawScrape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("raw_scrapes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs((data as RawScrape[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-chart-4/20 text-chart-4 border-chart-4/30",
      processed: "bg-primary/20 text-primary border-primary/30",
      error: "bg-destructive/20 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={map[status] ?? map.pending}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scraper Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos registos ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum dado recebido ainda. Executa o teu scraper Python para começar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.image_url && (
                          <img src={log.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        <span className="line-clamp-1 max-w-[200px]">{log.product_title ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-primary font-semibold">
                      {log.price != null ? `R$ ${log.price.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>{log.source ?? "—"}</TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {log.original_url ? (
                        <a href={log.original_url} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
