

# Radar das Promos — Painel Administrativo

## Visão Geral
Dashboard administrativo completo para gerir um sistema de marketing de afiliados automatizado. Tema dark com acentos em verde neon e roxo, responsivo para mobile.

---

## Fase 1: Fundação (Supabase + Auth + Layout)

### Configuração do Supabase
- Criar tabelas: `raw_scrapes`, `promotions`, `short_links`, `click_logs`, `scraper_sources`, `settings`
- Configurar RLS em todas as tabelas (apenas utilizadores autenticados acedem aos dados)

### Autenticação
- Página de Login com email/password
- Proteger todas as rotas do dashboard (redirecionar para login se não autenticado)

### Layout Base
- Sidebar com navegação: Dashboard, Fontes, Pipeline, Configurações
- Tema dark por padrão com cores verde neon (#39FF14) e roxo (#8B5CF6)
- Design responsivo — sidebar colapsável em mobile

---

## Fase 2: Dashboard Principal

### KPIs no Topo
- 4 cards com métricas: Promoções Raspadas (Hoje), Links Encurtados, Total de Cliques, Mensagens Enviadas
- Dados lidos em tempo real do Supabase

### Gráfico de Performance
- Gráfico de linha (Recharts) com cliques dos últimos 7 dias

---

## Fase 3: Gestão de Fontes (Scrapers)

### Tabela de Fontes
- Listar URLs alvo com nome, URL, status (A Rodar / Pendente / Erro) e última execução
- Indicador visual colorido por status

### Ações
- Modal para adicionar/editar fonte (nome, URL, intervalo de scraping)
- Toggle para ativar/desativar cada fonte
- Botão de eliminar com confirmação

---

## Fase 4: Pipeline de Promoções

### Aba "Novos Achados"
- Grid de cards com: imagem do produto (destaque), nome, preço original riscado vs preço promocional em verde
- Botão "Processar Promoção" em cada card

### Aba "Revisão e IA"
- Layout dividido: imagem + detalhes à esquerda, editor de mensagem à direita
- Campo editável para o System Prompt da IA
- Botão "Regenerar Mensagem" (chama edge function com API Gemini)
- Texto gerado editável manualmente
- Link curto exibido com botão de copiar
- Botão "Aprovar e Mover para Fila"

### Aba "Fila de Envio WhatsApp"
- Lista de mensagens prontas com preview
- Botões: "Copiar para Área de Transferência" e "Marcar como Enviado"
- Status visual: Pendente (amarelo), Enviado (verde), Erro (vermelho)

---

## Fase 5: Integração IA (Gemini)

### Edge Function
- Criar edge function para chamar a API do Gemini com o system prompt configurável
- Armazenar a chave API do Gemini como secret no Supabase
- Gerar mensagens engraçadas para WhatsApp com dados do produto

---

## Fase 6: Configurações

### Painel de Configurações
- Formulário para gerir a chave API do Gemini (guardada como secret)
- Campos para tags de afiliado (ID Magalu, Tag Amazon, etc.)
- Configuração de grupos de destino WhatsApp
- Campo para editar o System Prompt padrão da IA

