import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/PublicFooter";

const stores = [
  { icon: "shopping_cart", name: "amazon", color: "text-[#FF9900]" },
  { icon: "shopping_bag", name: "Shopee", color: "text-orange-500" },
  { icon: "storefront", name: "Magalu", color: "text-blue-500" },
  { icon: "handshake", name: "MercadoLivre", color: "text-yellow-500" },
  { icon: "local_mall", name: "Americanas", color: "text-red-500" },
  { icon: "shopping_cart", name: "amazon", color: "text-[#FF9900]" },
  { icon: "shopping_bag", name: "Shopee", color: "text-orange-500" },
  { icon: "storefront", name: "Magalu", color: "text-blue-500" },
];

const channels = [
  {
    icon: "devices",
    badge: "POPULAR",
    title: "Tech & Hardware",
    description: "Notebooks de alta performance, GPUs, Periféricos e Smartphones Premium.",
    cta: "Entrar no Canal",
    highlighted: false,
  },
  {
    icon: "smart_outlet",
    title: "Smart Home",
    description: "Automação residencial, Robôs aspiradores, Assistentes virtuais e Segurança.",
    cta: "Entrar no Canal",
    highlighted: false,
  },
  {
    icon: "sports_esports",
    title: "Games & Geek",
    description: "Consoles Next-Gen, Jogos físicos/digitais e Colecionáveis exclusivos.",
    cta: "Entrar no Canal",
    highlighted: false,
  },
  {
    icon: "bolt",
    badge: "LIVE",
    title: "Ofertas Relâmpago",
    description: "Erros de preço e promoções de curtíssima duração. Apenas para quem é rápido.",
    cta: "Acesso Prioritário",
    highlighted: true,
  },
];

const steps = [
  { icon: "database", title: "1. Data Scraping Massivo", text: "Nossos bots monitoram milhares de SKUs simultaneamente em 15 grandes e-commerces, detectando variações de preço em milissegundos." },
  { icon: "manage_search", title: "2. Filtragem via IA", text: "Algoritmos preditivos comparam o preço atual com o histórico de 12 meses, descartando \"metade do dobro\" e falsas promoções." },
  { icon: "broadcast_on_personal", title: "3. Push Instantâneo", text: "Assim que validada, a oferta é disparada via API para os grupos do WhatsApp, chegando até você antes que o estoque acabe." },
];

const stats = [
  { value: "R$ 500k+", label: "Economizados", sub: "Valor total economizado pela nossa comunidade nos últimos 30 dias." },
  { value: "15.000+", label: "Membros Verificados", sub: "Comunidade ativa de tech enthusiasts e smart shoppers." },
  { value: "99.8%", label: "Precisão da IA", sub: "Taxa de acerto na identificação de falsos descontos e fraudes." },
];

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
              <Radar className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-lg font-bold">Radar das Promos</span>
          </button>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Início</button>
            <a href="#tecnologia" className="text-sm text-foreground font-bold border-b-2 border-secondary pb-0.5">Tecnologia</a>
            <button onClick={() => navigate("/grupos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Grupos</button>
            <a href="#confianca" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── MAIN ─── */}
      <main className="relative pt-32 pb-20">
        {/* hero glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1200px] bg-[radial-gradient(circle_at_top,hsl(263_70%_58%/0.15)_0%,transparent_70%)] z-0" />

        {/* ─── HERO ─── */}
        <section className="relative z-10 px-4 md:px-6 mb-24">
          <div className="mx-auto max-w-4xl text-center flex flex-col items-center gap-8">
            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">IA Monitorando em Tempo Real</span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
              O seu radar inteligente <br />
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">de ofertas verificadas.</span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
              Nossa inteligência artificial analisa milhões de preços por dia para filtrar falsos descontos e entregar apenas oportunidades reais no seu WhatsApp.
            </p>

            <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={() => navigate("/grupos")} className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-900/20 transition-all hover:bg-[#1da851] sm:w-auto">
                <MaterialIcon name="chat" className="text-xl" />
                Entrar no Grupo VIP
                <MaterialIcon name="arrow_forward" className="text-sm opacity-70 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/como-funciona")}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/20 bg-card/40 px-8 py-4 text-base font-medium text-foreground transition-all hover:border-secondary/50 sm:w-auto"
              >
                <MaterialIcon name="play_circle" className="text-xl text-secondary" />
                Como funciona a IA
              </button>
            </div>

            <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MaterialIcon name="verified_user" className="text-secondary text-[1.25rem]" />
                Dados Criptografados
              </div>
              <div className="flex items-center gap-2">
                <MaterialIcon name="bolt" className="text-secondary text-[1.25rem]" />
                Alertas Instantâneos
              </div>
            </div>
          </div>
        </section>

        {/* ─── STORE MARQUEE ─── */}
        <section className="mb-24 overflow-hidden border-y border-border/10 py-10">
          <div className="mx-auto mb-6 max-w-7xl px-6 text-center">
            <p className="text-sm uppercase tracking-widest font-medium text-muted-foreground">Monitoramos as maiores lojas do Brasil</p>
          </div>
          <div className="overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-[marquee_20s_linear_infinite]">
              {[...stores, ...stores].map((s, i) => (
                <span key={i} className={`mx-8 inline-flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 md:mx-16 ${s.color}`}>
                  <MaterialIcon name={s.icon} className="text-4xl" />
                  <span className="text-2xl font-bold tracking-tighter">{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TECH PIPELINE ─── */}
        <section id="tecnologia" className="mb-32 px-4 md:px-6 scroll-mt-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Tecnologia a favor do seu bolso</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">Eliminamos o ruído e a fraude. Nosso pipeline de dados garante que você só veja o que importa.</p>
            </div>

            <div className="relative grid gap-8 md:grid-cols-3">
              {/* connecting line */}
              <div className="pointer-events-none absolute left-0 top-10 hidden h-px w-full bg-gradient-to-r from-transparent via-secondary/30 to-transparent md:block" />

              {steps.map((step) => (
                <div key={step.title} className="group relative z-10 flex flex-col items-center text-center">
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-secondary/30 bg-card shadow-[0_0_30px_-10px_hsl(263_70%_58%/0.3)] transition-colors group-hover:border-secondary">
                    <MaterialIcon name={step.icon} className="text-3xl text-secondary" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                  <p className="px-6 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CHANNELS ─── */}
        <section id="categorias" className="mb-24 px-4 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold">Canais Segmentados</h2>
                <p className="text-muted-foreground">Entre nos ecossistemas que mais te interessam.</p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/20 text-muted-foreground transition-colors hover:bg-card/20 hover:text-foreground">
                  <MaterialIcon name="chevron_left" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/20 text-muted-foreground transition-colors hover:bg-card/20 hover:text-foreground">
                  <MaterialIcon name="chevron_right" />
                </button>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: "none" }}>
              {channels.map((ch) => (
                <div
                  key={ch.title}
                  className={`min-w-[340px] snap-start rounded-2xl p-8 flex flex-col gap-6 transition-all ${
                    ch.highlighted
                      ? "relative overflow-hidden border border-secondary/20"
                      : "bg-white/5 backdrop-blur-md border border-white/10 hover:border-secondary/40"
                  }`}
                >
                  {ch.highlighted && (
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-50" />
                  )}

                  <div className={`flex items-start justify-between ${ch.highlighted ? "relative z-10" : ""}`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${ch.highlighted ? "bg-secondary text-secondary-foreground" : "bg-secondary/10 text-secondary"}`}>
                      <MaterialIcon name={ch.icon} />
                    </div>
                    {ch.badge && (
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${
                        ch.badge === "LIVE"
                          ? "bg-secondary text-secondary-foreground"
                          : "border border-border/10 bg-card/10 text-muted-foreground"
                      }`}>
                        {ch.badge}
                      </span>
                    )}
                  </div>

                  <div className={ch.highlighted ? "relative z-10" : ""}>
                    <h3 className="mb-2 text-xl font-bold">{ch.title}</h3>
                    <p className="text-sm text-muted-foreground">{ch.description}</p>
                  </div>

                  <button
                    onClick={() => navigate("/grupos")}
                    className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
                      ch.highlighted
                        ? "relative z-10 bg-foreground text-background font-bold hover:opacity-90"
                        : ch.badge === "POPULAR"
                          ? "border border-secondary/30 text-secondary hover:bg-secondary hover:text-secondary-foreground"
                          : "border border-border/20 text-muted-foreground hover:bg-card/20"
                    }`}
                  >
                    {ch.cta}
                    <MaterialIcon name={ch.highlighted ? "lock_open" : "arrow_forward"} className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section id="confianca" className="mb-24 px-4 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/20 md:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center gap-2 bg-card p-8 text-center transition-colors hover:bg-card/80">
                  <span className="text-4xl font-bold">{s.value}</span>
                  <span className="text-sm font-medium uppercase tracking-wider text-secondary">{s.label}</span>
                  <p className="mt-2 text-sm text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="px-4 md:px-6">
          <div className="relative mx-auto max-w-5xl">
            {/* glow behind */}
            <div className="absolute inset-0 rounded-full bg-secondary/20 blur-[100px]" />
            <div className="relative overflow-hidden rounded-3xl border border-border/20 bg-card p-12 text-center md:p-16">
              {/* dot pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              <div className="relative z-10 flex flex-col items-center gap-8">
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
                  Comece a comprar com <br /> inteligência hoje.
                </h2>
                <p className="max-w-xl text-lg text-muted-foreground">
                  Junte-se ao grupo VIP gratuitamente e nunca mais pague o preço cheio em tecnologia.
                </p>
                <button onClick={() => navigate("/grupos")} className="flex items-center gap-3 rounded-xl bg-[#25D366] px-10 py-4 text-lg font-bold text-white transition-all hover:bg-[#1da851] hover:shadow-lg hover:shadow-green-500/20">
                  <MaterialIcon name="rocket_launch" />
                  Entrar no Grupo VIP
                </button>
                <p className="text-xs text-muted-foreground">100% Gratuito • Cancele quando quiser</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="mt-24">
        <PublicFooter />
      </div>
    </div>
  );
}
