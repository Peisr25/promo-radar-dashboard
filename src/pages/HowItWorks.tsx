import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/PublicFooter";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

const features = [
  {
    icon: "trending_up",
    title: "Previsão de Preço",
    description: "Algoritmos preditivos que analisam o histórico de 12 meses para identificar o momento ideal de compra.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  },
  {
    icon: "shield",
    title: "Filtro de Falsas Promos",
    description: "Detectamos automaticamente o golpe do \"metade do dobro\" comparando preços reais dos últimos meses.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
  },
  {
    icon: "notifications_active",
    title: "Alerta Ultrarrápido",
    description: "Disparos em milissegundos via API para seu WhatsApp antes que o estoque acabe.",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
  },
];

const steps = [
  {
    num: "01",
    title: "Crawling Massivo",
    desc: "Bots monitoram milhares de SKUs em 15+ e-commerces simultaneamente, coletando variações de preço em tempo real.",
    icon: "language",
  },
  {
    num: "02",
    title: "Análise & Validação",
    desc: "IA compara preço atual com histórico de 12 meses, descartando falsas promoções e verificando legitimidade das lojas.",
    icon: "psychology",
  },
  {
    num: "03",
    title: "Disparo Instantâneo",
    desc: "Oferta validada é formatada e disparada via API para os grupos de WhatsApp em milissegundos.",
    icon: "send",
  },
];

const trustCards = [
  { icon: "encrypted", color: "text-primary", title: "Proteção de Dados", desc: "Criptografia de ponta a ponta em todas as comunicações." },
  { icon: "verified", color: "text-secondary", title: "Links Verificados", desc: "Todo link é checado contra bases de phishing e fraude." },
  { icon: "visibility", color: "text-chart-3", title: "Transparência Total", desc: "Sem taxas ocultas. Lucro via comissões de afiliado declaradas." },
  { icon: "support_agent", color: "text-chart-4", title: "Suporte Humano", desc: "Equipe real pronta para ajudar via chat em horário comercial." },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/30 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
              <Radar className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-lg font-bold">Radar das Promos</span>
          </button>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Início</button>
            <a href="/#tech" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tecnologia</a>
            <button onClick={() => navigate("/grupos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Grupos</button>
            <a href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(263_70%_58%/0.12)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-sm text-secondary">
            <MaterialIcon name="auto_awesome" className="text-base" />
            Tecnologia Exclusiva
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Como Funciona o{" "}
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Radar IA</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Descubra como nossa inteligência artificial analisa milhões de preços por dia para filtrar falsos descontos e entregar apenas oportunidades reais.
          </p>
        </div>
      </section>

      {/* ─── FEATURE CARDS ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur transition-all hover:border-secondary/30 hover:-translate-y-1">
              {/* BG image */}
              <div className="absolute inset-0 opacity-20 mix-blend-luminosity bg-cover bg-center" style={{ backgroundImage: `url('${f.image}')` }} />
              <div className="relative z-10 p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary shadow-[0_0_20px_hsl(263_70%_58%/0.3)]">
                  <MaterialIcon name={f.icon} className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CICLO DA ECONOMIA INTELIGENTE ─── */}
      <section className="border-y border-border/50 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl mb-4">
            Ciclo da <span className="text-secondary">Economia Inteligente</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Do scraping ao disparo, tudo acontece em segundos.
          </p>

          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Steps */}
            <div className="flex flex-col gap-8">
              {steps.map((s) => (
                <div key={s.num} className="flex gap-4 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary font-bold text-lg group-hover:bg-secondary/20 transition-colors">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MaterialIcon name={s.icon} className="text-xl text-secondary" />
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Animated circle */}
            <div className="flex items-center justify-center">
              <div className="relative h-72 w-72 sm:h-80 sm:w-80">
                {/* Spinning border ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/30 animate-spin"
                  style={{ animationDuration: "20s" }}
                />
                <div
                  className="absolute inset-3 rounded-full border-2 border-dashed border-primary/20 animate-spin"
                  style={{ animationDuration: "15s", animationDirection: "reverse" }}
                />
                {/* Center content */}
                <div className="absolute inset-8 rounded-full bg-card/60 border border-border/50 backdrop-blur flex flex-col items-center justify-center gap-2 shadow-[0_0_40px_hsl(263_70%_58%/0.15)]">
                  <MaterialIcon name="radar" className="text-5xl text-secondary" />
                  <span className="text-sm font-bold text-secondary">Radar IA</span>
                  <span className="text-xs text-muted-foreground">Operando 24/7</span>
                </div>
                {/* Orbiting dots */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 h-3 w-3 rounded-full bg-primary shadow-[var(--neon-glow)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 h-3 w-3 rounded-full bg-secondary shadow-[var(--purple-glow)]" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-3 w-3 rounded-full bg-primary shadow-[var(--neon-glow)]" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-3 w-3 rounded-full bg-secondary shadow-[var(--purple-glow)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEGURANÇA E CONFIANÇA ─── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl mb-4">
          Segurança e <span className="text-secondary">Confiança</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Sua proteção é nossa prioridade número um.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {trustCards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur transition-colors hover:border-secondary/30">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <MaterialIcon name={c.icon} className={`text-2xl ${c.color}`} />
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(120_100%_55%/0.08)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <MaterialIcon name="rocket_launch" className="text-5xl text-primary mb-4" />
          <h2 className="text-3xl font-bold sm:text-4xl">
            Comece a economizar <span className="text-primary">agora</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Junte-se ao grupo VIP gratuitamente e receba alertas de ofertas verificadas no seu WhatsApp.
          </p>
          <Button
            size="lg"
            className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--neon-glow)] font-bold"
            onClick={() => navigate("/grupos")}
          >
            <MaterialIcon name="chat" className="text-lg" />
            Entrar no Grupo VIP Grátis
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">100% Gratuito • Cancele quando quiser</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <PublicFooter />
    </div>
  );
}
