import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

const pillars = [
  { icon: "rocket_launch", title: "Inovação", text: "Tecnologia de ponta para rastrear preços." },
  { icon: "security", title: "Segurança", text: "Apenas lojas verificadas e confiáveis." },
  { icon: "groups", title: "Comunidade", text: "Milhares de usuários compartilhando dicas." },
];

export default function Institutional() {
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
      <section className="relative pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(263_70%_58%/0.12)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold sm:text-5xl">Institucional e Legal</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Transparência é fundamental para nós. Aqui você encontra informações sobre nossa história, políticas de privacidade e termos de uso.
          </p>
        </div>
      </section>

      {/* ─── NAV PILLS ─── */}
      <div className="mx-auto flex max-w-md flex-wrap justify-center gap-3 px-4 pb-12">
        {[
          { icon: "info", label: "Sobre Nós", id: "sobre" },
          { icon: "verified_user", label: "Privacidade", id: "privacidade" },
          { icon: "gavel", label: "Termos de Uso", id: "termos" },
          { icon: "cookie", label: "Cookies", id: "cookies" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-secondary/30 hover:text-secondary"
          >
            <MaterialIcon name={item.icon} className="text-base" />
            {item.label}
          </a>
        ))}
      </div>

      {/* ─── SOBRE ─── */}
      <section id="sobre" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold">Nossa História</h2>
        <p className="mt-1 text-muted-foreground">Conectando pessoas às melhores oportunidades desde 2018</p>

        <div className="mt-10 rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur sm:p-8">
          <h3 className="text-xl font-semibold">Sobre o Radar das Promos</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            O Radar das Promos nasceu de uma necessidade simples: encontrar descontos reais em um mar de ofertas duvidosas. Nossa missão é ajudar você a encontrar as melhores ofertas da internet com segurança e praticidade. Monitoramos centenas de lojas em tempo real, utilizando algoritmos avançados para verificar a veracidade dos descontos.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Acreditamos que comprar bem é um direito de todos. Por isso, nossa plataforma é e sempre será gratuita para os usuários. Trabalhamos incansavelmente para garantir que cada link clicado leve a uma economia real.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur text-center">
              <MaterialIcon name={p.icon} className="text-3xl text-secondary" />
              <h4 className="mt-2 font-semibold">{p.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRIVACIDADE ─── */}
      <section id="privacidade" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <MaterialIcon name="lock" className="text-2xl text-secondary" />
            <h2 className="text-2xl font-bold">Privacidade</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Entenda como coletamos, usamos e protegemos seus dados pessoais. Sua privacidade é nossa prioridade absoluta. Seguimos rigorosamente a LGPD.
          </p>
          <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
            Ler política completa
            <MaterialIcon name="arrow_forward" className="text-base" />
          </button>
        </div>
      </section>

      {/* ─── TERMOS ─── */}
      <section id="termos" className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <MaterialIcon name="description" className="text-2xl text-secondary" />
            <h2 className="text-2xl font-bold">Termos de Uso</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            As regras que regem o uso da nossa plataforma. Ao utilizar o Radar das Promos, você concorda com estas condições para garantir um ambiente seguro.
          </p>
          <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
            Ler termos completos
            <MaterialIcon name="arrow_forward" className="text-base" />
          </button>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cookies" className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold">Precisa de ajuda jurídica ou suporte?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Se você tiver dúvidas específicas sobre nossos termos ou como seus dados são tratados, nossa equipe de DPO (Data Protection Officer) está à disposição.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <MaterialIcon name="mail" className="text-lg" />
              Entrar em Contato
            </Button>
            <Button variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10">
              Central de Ajuda
            </Button>
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
