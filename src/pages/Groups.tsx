import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

const categories = [
  { icon: "search", label: "Todos" },
  { icon: "devices", label: "Tech" },
  { icon: "chair", label: "Casa" },
  { icon: "styler", label: "Moda" },
  { icon: "sports_esports", label: "Geek" },
  { icon: "child_care", label: "Kids" },
  { icon: "bolt", label: "Relâmpago" },
];

const groups = [
  {
    members: "12.5k", badge: "TECH", badgeColor: "bg-primary/20 text-primary",
    title: "Tech & Gadgets", desc: "Smartphones, notebooks, fones e periféricos.",
    freq: "Alta", freqIcon: "bolt", status: "Vagas Abertas", statusIcon: "check_circle", statusColor: "text-primary",
    cta: "Entrar Agora", ctaIcon: "chat",
  },
  {
    members: "8.2k", badge: "CASA", badgeColor: "bg-secondary/20 text-secondary",
    title: "Casa & Decoração", desc: "Eletrodomésticos, móveis e utilidades.",
    freq: "Média", freqIcon: "schedule", status: "Vagas Abertas", statusIcon: "check_circle", statusColor: "text-primary",
    cta: "Entrar Agora", ctaIcon: "chat",
  },
  {
    members: "15k", badge: "MODA", badgeColor: "bg-pink-500/20 text-pink-400",
    title: "Moda & Estilo", desc: "Roupas, calçados e acessórios em promoção.",
    freq: "Alta", freqIcon: "bolt", status: "Últimas Vagas", statusIcon: "warning", statusColor: "text-yellow-400",
    cta: "Entrar Agora", ctaIcon: "chat",
  },
  {
    members: "6.8k", badge: "GEEK", badgeColor: "bg-secondary/20 text-secondary",
    title: "Mundo Geek", desc: "Jogos, HQs, colecionáveis e cultura pop.",
    freq: "Média", freqIcon: "schedule", status: "Vagas Abertas", statusIcon: "check_circle", statusColor: "text-primary",
    cta: "Entrar Agora", ctaIcon: "chat",
  },
  {
    members: "22k", badge: "HOT", badgeColor: "bg-destructive/20 text-destructive",
    title: "Promoções Relâmpago", desc: "Erros de preço, cupons limitados e ofertas rápidas.",
    freq: "Muito Alta", freqIcon: "local_fire_department", status: "Lista de Espera", statusIcon: "lock", statusColor: "text-muted-foreground",
    cta: "Avisar Vaga", ctaIcon: "notifications_active",
  },
  {
    members: "5.4k", badge: "KIDS", badgeColor: "bg-primary/20 text-primary",
    title: "Universo Kids", desc: "Brinquedos, fraldas e roupas infantis.",
    freq: "Média", freqIcon: "schedule", status: "Vagas Abertas", statusIcon: "check_circle", statusColor: "text-primary",
    cta: "Entrar Agora", ctaIcon: "chat",
  },
];

export default function Groups() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
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
            <button className="text-sm text-foreground font-medium transition-colors">Grupos</button>
            <a href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-12 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(263_70%_58%/0.12)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <span className="mb-4 inline-block rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-sm text-secondary">
            Vagas disponíveis hoje
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl">Escolha seu nicho de economia</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Entre nos grupos VIP que mais combinam com seu perfil de consumo. Monitoramento em tempo real com curadoria humana e bots inteligentes.
          </p>
        </div>
      </section>

      {/* ─── CATEGORY PILLS ─── */}
      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 px-4 pb-12">
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
              i === 0
                ? "bg-secondary text-secondary-foreground"
                : "border border-border/50 bg-card/40 text-muted-foreground hover:border-secondary/30 hover:text-secondary"
            }`}
          >
            <MaterialIcon name={cat.icon} className="text-base" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── GROUPS GRID ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="group flex flex-col rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur transition-colors hover:border-secondary/30">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${g.badgeColor}`}>
                  {g.badge}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MaterialIcon name="group" className="text-sm" />
                  {g.members}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-semibold">{g.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{g.desc}</p>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground/70">Frequência</span>
                  <MaterialIcon name={g.freqIcon} className="text-sm text-secondary" />
                  {g.freq}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground/70">Status</span>
                  <MaterialIcon name={g.statusIcon} className={`text-sm ${g.statusColor}`} />
                  {g.status}
                </span>
              </div>

              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/10 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20">
                <MaterialIcon name={g.ctaIcon} className="text-base" />
                {g.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-2xl font-bold">Não encontrou o que procurava?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Temos novos grupos abrindo toda semana. Inscreva-se na nossa newsletter para ser avisado primeiro.
          </p>
          <div className="mt-6 flex gap-3">
            <Input placeholder="seu@email.com" className="flex-1" />
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Me avisar</Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-secondary" />
            <span className="text-sm font-semibold">Radar das Promos</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Radar das Promos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
