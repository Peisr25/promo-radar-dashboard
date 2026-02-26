import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

const stores = [
  { icon: "shopping_cart", name: "amazon" },
  { icon: "shopping_bag", name: "Shopee" },
  { icon: "storefront", name: "Magalu" },
  { icon: "handshake", name: "MercadoLivre" },
  { icon: "local_mall", name: "Americanas" },
  { icon: "shopping_cart", name: "amazon" },
  { icon: "shopping_bag", name: "Shopee" },
  { icon: "storefront", name: "Magalu" },
];

const channels = [
  {
    icon: "devices",
    badge: "POPULAR",
    title: "Tech & Hardware",
    description: "Notebooks de alta performance, GPUs, Periféricos e Smartphones Premium.",
    cta: "Entrar no Canal",
  },
  {
    icon: "smart_outlet",
    title: "Smart Home",
    description: "Automação residencial, Robôs aspiradores, Assistentes virtuais e Segurança.",
    cta: "Entrar no Canal",
  },
  {
    icon: "sports_esports",
    title: "Games & Geek",
    description: "Consoles Next-Gen, Jogos físicos/digitais e Colecionáveis exclusivos.",
    cta: "Entrar no Canal",
  },
  {
    icon: "bolt",
    badge: "LIVE",
    title: "Ofertas Relâmpago",
    description: "Erros de preço e promoções de curtíssima duração. Apenas para quem é rápido.",
    cta: "Acesso Prioritário",
    ctaIcon: "lock_open",
  },
];

const stats = [
  { value: "R$ 500k+", label: "Economizados", sub: "Valor total economizado pela nossa comunidade nos últimos 30 dias." },
  { value: "15.000+", label: "Membros Verificados", sub: "Comunidade ativa de tech enthusiasts e smart shoppers." },
  { value: "99.8%", label: "Precisão da IA", sub: "Taxa de acerto na identificação de falsos descontos e fraudes." },
];

const steps = [
  { icon: "database", title: "1. Data Scraping Massivo", text: "Nossos bots monitoram milhares de SKUs simultaneamente em 15 grandes e-commerces, detectando variações de preço em milissegundos." },
  { icon: "manage_search", title: "2. Filtragem via IA", text: "Algoritmos preditivos comparam o preço atual com o histórico de 12 meses, descartando \"metade do dobro\" e falsas promoções." },
  { icon: "broadcast_on_personal", title: "3. Push Instantâneo", text: "Assim que validada, a oferta é disparada via API para os grupos do WhatsApp, chegando até você antes que o estoque acabe." },
];

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Google Material Symbols font loaded via index.html */}

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/30 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
              <Radar className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-lg font-bold">Radar das Promos</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#tech" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tecnologia</a>
            <a href="#channels" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Grupos</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(263_70%_58%/0.12)_0%,transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-sm text-secondary">
            <MaterialIcon name="sensors" className="text-base" />
            IA Monitorando em Tempo Real
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            O seu radar inteligente{" "}
            <br className="hidden sm:block" />
            <span className="text-secondary">de ofertas verificadas.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Nossa inteligência artificial analisa milhões de preços por dia para filtrar falsos descontos e entregar apenas oportunidades reais no seu WhatsApp.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--purple-glow)]">
              <MaterialIcon name="chat" className="text-lg" />
              Entrar no Grupo VIP
              <MaterialIcon name="arrow_forward" className="text-lg" />
            </Button>
            <Button size="lg" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <MaterialIcon name="play_circle" className="text-lg" />
              Como funciona a IA
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MaterialIcon name="verified_user" className="text-base text-primary" />
              Dados Criptografados
            </span>
            <span className="flex items-center gap-1.5">
              <MaterialIcon name="bolt" className="text-base text-primary" />
              Alertas Instantâneos
            </span>
          </div>
        </div>
      </section>

      {/* ─── STORE MARQUEE ─── */}
      <section className="border-y border-border/50 bg-card/30 py-6">
        <p className="mb-4 text-center text-sm text-muted-foreground">Monitoramos as maiores lojas do Brasil</p>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_20s_linear_infinite]">
            {[...stores, ...stores].map((s, i) => (
              <span key={i} className="mx-6 inline-flex items-center gap-2 text-lg text-muted-foreground">
                <MaterialIcon name={s.icon} className="text-2xl" />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH PIPELINE ─── */}
      <section id="tech" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Tecnologia a favor do seu <span className="text-secondary">bolso</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Eliminamos o ruído e a fraude. Nosso pipeline de dados garante que você só veja o que importa.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="group rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur transition-colors hover:border-secondary/30">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary/20">
                <MaterialIcon name={step.icon} className="text-2xl" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CHANNELS ─── */}
      <section id="channels" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Canais Segmentados</h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
          Entre nos ecossistemas que mais te interessam.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((ch) => (
            <div key={ch.title} className="group flex flex-col rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur transition-colors hover:border-secondary/30">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <MaterialIcon name={ch.icon} className="text-xl" />
                </div>
                {ch.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ch.badge === "LIVE" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                    {ch.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold">{ch.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground leading-relaxed">{ch.description}</p>
              <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
                {ch.cta}
                <MaterialIcon name={ch.ctaIcon ?? "arrow_forward"} className="text-base" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="border-y border-border/50 bg-card/30 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:grid-cols-3 sm:px-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-secondary">{s.value}</p>
              <p className="mt-1 font-medium">{s.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(263_70%_58%/0.1)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Comece a comprar com{" "}
            <br className="hidden sm:block" />
            <span className="text-secondary">inteligência</span> hoje.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Junte-se ao grupo VIP gratuitamente e nunca mais pague o preço cheio em tecnologia.
          </p>
          <Button size="lg" className="mt-8 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--purple-glow)]">
            <MaterialIcon name="rocket_launch" className="text-lg" />
            Entrar no Grupo VIP
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">100% Gratuito • Cancele quando quiser</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-secondary" />
            <span className="text-sm font-semibold">Radar das Promos</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Radar Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
