import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Plus, Trash2, RefreshCw } from "lucide-react";
import { testEvolutionConnection, fetchEvolutionGroups } from "@/lib/evolution-api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function WhatsAppSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [config, setConfig] = useState({ api_url: "", api_key: "", session_name: "" });
  const [groups, setGroups] = useState<any[]>([]);
  const [groupLimit, setGroupLimit] = useState(50);
  const [newGroup, setNewGroup] = useState({ group_id: "", group_name: "", group_description: "" });

  useEffect(() => {
    if (user) { loadConfig(); loadGroups(); }
  }, [user]);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("evolution_config")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) setConfig({ api_url: data.api_url, api_key: data.api_key, session_name: data.session_name });
  };

  const loadGroups = async () => {
    const { data } = await supabase
      .from("whatsapp_groups")
      .select("*")
      .eq("user_id", user!.id)
      .order("group_name");
    if (data) setGroups(data);
  };

  const saveConfig = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("evolution_config").upsert({
      user_id: user.id,
      ...config,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Configuração salva!" });
  };

  const handleTest = async () => {
    setTesting(true);
    const result = await testEvolutionConnection();
    setTesting(false);
    toast({
      title: result.success ? "Conexão OK!" : "Falha na conexão",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const handleFetchGroups = async () => {
    if (!user) return;
    setFetchingGroups(true);
    const result = await fetchEvolutionGroups({ limit: groupLimit });
    setFetchingGroups(false);
    if (!result.success || !result.groups) {
      toast({ title: "Erro ao buscar grupos", description: result.message, variant: "destructive" });
      return;
    }
    // Safety: convert object to array if needed
    const groupsArr = Array.isArray(result.groups) ? result.groups : Object.values(result.groups);
    let added = 0;
    for (const g of groupsArr) {
      const gid = g.id || g.jid;
      const gname = g.subject || g.name || gid;
      if (!gid) continue;
      const { error } = await supabase.from("whatsapp_groups").upsert({
        user_id: user.id,
        group_id: gid,
        group_name: gname,
        group_description: g.desc || null,
      }, { onConflict: "user_id,group_id" });
      if (!error) added++;
    }
    toast({ title: `${added} de ${groupsArr.length} grupo(s) importados!` });
    loadGroups();
  };

  const addGroup = async () => {
    if (!user || !newGroup.group_id || !newGroup.group_name) return;
    const { error } = await supabase.from("whatsapp_groups").insert({
      user_id: user.id,
      ...newGroup,
    });
    if (error) toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Grupo adicionado!" });
      setNewGroup({ group_id: "", group_name: "", group_description: "" });
      setAddDialogOpen(false);
      loadGroups();
    }
  };

  const deleteGroup = async (id: string) => {
    await supabase.from("whatsapp_groups").delete().eq("id", id);
    toast({ title: "Grupo removido!" });
    loadGroups();
  };

  const deleteAllGroups = async () => {
    if (!user) return;
    const { error } = await supabase.from("whatsapp_groups").delete().eq("user_id", user.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else { toast({ title: "Todos os grupos removidos!" }); setGroups([]); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações WhatsApp</h1>

      <Card>
        <CardHeader>
          <CardTitle>Conexão com Evolution API</CardTitle>
          <CardDescription>Configure sua instância Evolution API para envio automático de mensagens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input placeholder="https://sua-api.com" value={config.api_url}
              onChange={(e) => setConfig({ ...config, api_url: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder="Sua API Key" value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nome da Instância</Label>
            <Input placeholder="default" value={config.session_name}
              onChange={(e) => setConfig({ ...config, session_name: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveConfig} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos do WhatsApp</CardTitle>
              <CardDescription>Gerencie os grupos de destino das promoções</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Limite</Label>
                  <Input type="number" min={1} max={500} value={groupLimit}
                    onChange={(e) => setGroupLimit(Number(e.target.value) || 50)}
                    className="w-20 h-9" />
                </div>
                <Button variant="outline" size="sm" onClick={handleFetchGroups} disabled={fetchingGroups}>
                  {fetchingGroups ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Buscar da API
                </Button>
              </div>
              {groups.length > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteAllGroups}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Todos
                </Button>
              )}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Grupo</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>ID do Grupo</Label>
                      <Input placeholder="120363...@g.us" value={newGroup.group_id}
                        onChange={(e) => setNewGroup({ ...newGroup, group_id: e.target.value })} />
                      <p className="text-xs text-muted-foreground">Formato: números@g.us</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input placeholder="Nome do grupo" value={newGroup.group_name}
                        onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Input placeholder="Descrição" value={newGroup.group_description}
                        onChange={(e) => setNewGroup({ ...newGroup, group_description: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addGroup}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum grupo cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Enviadas</TableHead>
                  <TableHead>Último Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.group_name}</TableCell>
                    <TableCell><code className="text-xs">{g.group_id}</code></TableCell>
                    <TableCell>{g.messages_sent}</TableCell>
                    <TableCell>{g.last_message_at ? new Date(g.last_message_at).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      {g.is_active ? (
                        <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30"><CheckCircle className="mr-1 h-3 w-3" /> Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle className="mr-1 h-3 w-3" /> Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteGroup(g.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
