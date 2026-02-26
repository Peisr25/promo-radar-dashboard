import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle, XCircle, Plus, Trash2, RefreshCw, Pencil,
  Zap, Link2, Copy, RotateCcw,
} from "lucide-react";
import {
  testEvolutionConnection,
  fetchEvolutionGroups,
  fetchGroupInviteCode,
  revokeGroupInviteCode,
  updateGroupSubject,
  updateGroupDescription,
} from "@/lib/evolution-api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type WhatsAppGroup = Tables<"whatsapp_groups">;

// Available niches/categories for groups
const AVAILABLE_CATEGORIES = [
  "Eletrônicos",
  "Celulares",
  "Informática",
  "Games",
  "Eletrodomésticos",
  "Moda",
  "Beleza",
  "Casa & Decoração",
  "Esportes",
  "Automotivo",
  "Livros",
  "Brinquedos",
  "Alimentos",
  "Saúde",
  "Ferramentas",
  "Pet Shop",
  "Bebê",
  "Ofertas Gerais",
];

export default function WhatsAppSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [config, setConfig] = useState({ api_url: "", api_key: "", session_name: "" });
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [groupLimit, setGroupLimit] = useState(50);

  // New group form
  const [newGroup, setNewGroup] = useState({
    group_id: "",
    group_name: "",
    group_description: "",
    invite_link: "",
  });

  // Edit form state
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editFlashOnly, setEditFlashOnly] = useState(false);
  const [editInviteLink, setEditInviteLink] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(false);
  const [revokingInvite, setRevokingInvite] = useState(false);
  const [updatingSubject, setUpdatingSubject] = useState(false);
  const [updatingDescription, setUpdatingDescription] = useState(false);

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

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("whatsapp_groups")
      .select("*")
      .eq("user_id", user.id)
      .order("group_name");
    if (data) setGroups(data as WhatsAppGroup[]);
  }, [user]);

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
      group_id: newGroup.group_id,
      group_name: newGroup.group_name,
      group_description: newGroup.group_description || null,
      invite_link: newGroup.invite_link || null,
    });
    if (error) toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Grupo adicionado!" });
      setNewGroup({ group_id: "", group_name: "", group_description: "", invite_link: "" });
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

  // ---------------------------------------------------------------------------
  // Edit Modal
  // ---------------------------------------------------------------------------

  const openEditModal = (g: WhatsAppGroup) => {
    setEditingGroup(g);
    setEditCategories(g.categories || []);
    setEditFlashOnly(g.is_flash_deals_only ?? false);
    setEditInviteLink(g.invite_link || "");
    setEditDescription(g.group_description || "");
    setEditIsActive(g.is_active ?? true);
    setEditDialogOpen(true);
  };

  const toggleEditCategory = (cat: string) => {
    setEditCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const saveEdit = async () => {
    if (!editingGroup) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("whatsapp_groups")
      .update({
        categories: editCategories,
        is_flash_deals_only: editFlashOnly,
        invite_link: editInviteLink || null,
        group_description: editDescription || null,
        is_active: editIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingGroup.id);
    setEditSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo atualizado!" });
      setEditDialogOpen(false);
      loadGroups();
    }
  };

  // Fetch invite code from Evolution API
  const handleFetchInviteCode = async () => {
    if (!editingGroup) return;
    setFetchingInvite(true);
    const result = await fetchGroupInviteCode(editingGroup.group_id);
    setFetchingInvite(false);
    if (result.success && result.inviteUrl) {
      setEditInviteLink(result.inviteUrl);
      toast({ title: "Link de convite obtido!" });
    } else {
      toast({ title: "Erro ao obter link", description: result.message, variant: "destructive" });
    }
  };

  // Revoke and get new invite code
  const handleRevokeInviteCode = async () => {
    if (!editingGroup) return;
    setRevokingInvite(true);
    const result = await revokeGroupInviteCode(editingGroup.group_id);
    setRevokingInvite(false);
    if (result.success && result.inviteUrl) {
      setEditInviteLink(result.inviteUrl);
      toast({ title: "Link revogado e novo gerado!" });
    } else {
      toast({ title: "Erro ao revogar link", description: result.message, variant: "destructive" });
    }
  };

  // Update group subject via Evolution API
  const handleUpdateSubject = async () => {
    if (!editingGroup) return;
    setUpdatingSubject(true);
    const result = await updateGroupSubject(editingGroup.group_id, editingGroup.group_name);
    setUpdatingSubject(false);
    toast({
      title: result.success ? "Nome atualizado no WhatsApp!" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  // Update group description via Evolution API
  const handleUpdateDescription = async () => {
    if (!editingGroup) return;
    setUpdatingDescription(true);
    const result = await updateGroupDescription(editingGroup.group_id, editDescription);
    setUpdatingDescription(false);
    toast({
      title: result.success ? "Descrição atualizada no WhatsApp!" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações WhatsApp</h1>

      {/* Connection Config Card */}
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

      {/* Groups Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos do WhatsApp</CardTitle>
              <CardDescription>Gerencie os grupos de destino das promoções e seus nichos</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
                  <DialogHeader>
                    <DialogTitle>Adicionar Grupo</DialogTitle>
                    <DialogDescription>Preencha os dados do novo grupo WhatsApp</DialogDescription>
                  </DialogHeader>
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
                    <div className="space-y-2">
                      <Label>Link de Convite (opcional)</Label>
                      <Input placeholder="https://chat.whatsapp.com/..." value={newGroup.invite_link}
                        onChange={(e) => setNewGroup({ ...newGroup, invite_link: e.target.value })} />
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nichos</TableHead>
                    <TableHead>Enviadas</TableHead>
                    <TableHead>Último Envio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {g.group_name}
                          {g.is_flash_deals_only && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
                              <Zap className="h-3 w-3" /> Flash
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs">{g.group_id}</code></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(g.categories && g.categories.length > 0) ? (
                            g.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {cat}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{g.messages_sent ?? 0}</TableCell>
                      <TableCell>{g.last_message_at ? new Date(g.last_message_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        {g.is_active ? (
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                            <CheckCircle className="mr-1 h-3 w-3" /> Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <XCircle className="mr-1 h-3 w-3" /> Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(g)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteGroup(g.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Group Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>Configure nichos, link de convite e opções do grupo</DialogDescription>
          </DialogHeader>

          {editingGroup && (
            <div className="space-y-5">
              {/* Read-only fields */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome do Grupo</Label>
                <div className="flex items-center gap-2">
                  <Input value={editingGroup.group_name} disabled className="bg-muted" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateSubject}
                    disabled={updatingSubject}
                    title="Sincronizar nome no WhatsApp"
                  >
                    {updatingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">ID do Grupo</Label>
                <Input value={editingGroup.group_id} disabled className="bg-muted font-mono text-xs" />
              </div>

              {/* Invite Link */}
              <div className="space-y-2">
                <Label>Link de Convite</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editInviteLink}
                    onChange={(e) => setEditInviteLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="flex-1"
                  />
                  {editInviteLink && (
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(editInviteLink)} title="Copiar">
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleFetchInviteCode} disabled={fetchingInvite}>
                    {fetchingInvite ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
                    Obter da API
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRevokeInviteCode} disabled={revokingInvite}>
                    {revokingInvite ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                    Revogar e Gerar Novo
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <div className="flex items-start gap-2">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descrição do grupo..."
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateDescription}
                    disabled={updatingDescription}
                    title="Sincronizar descrição no WhatsApp"
                    className="mt-1"
                  >
                    {updatingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Categories / Nichos */}
              <div className="space-y-2">
                <Label>Nichos / Categorias</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione os nichos que este grupo recebe. Clique para ativar/desativar.
                </p>
                <div className="flex flex-wrap gap-2 rounded-md border border-input p-3 min-h-[44px]">
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={editCategories.includes(cat) ? "default" : "outline"}
                      className="cursor-pointer select-none transition-colors"
                      onClick={() => toggleEditCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
                {editCategories.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {editCategories.length} nicho(s) selecionado(s)
                  </p>
                )}
              </div>

              {/* Flash Deals Only */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-destructive" />
                    Apenas Ofertas Relâmpago
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, este grupo só recebe ofertas com desconto agressivo (flash deals)
                  </p>
                </div>
                <Switch checked={editFlashOnly} onCheckedChange={setEditFlashOnly} />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Grupo Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Grupos inativos não recebem mensagens automáticas
                  </p>
                </div>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
