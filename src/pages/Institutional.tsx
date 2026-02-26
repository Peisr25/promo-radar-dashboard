import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/PublicFooter";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

const pillars = [
  { icon: "rocket_launch", title: "Inovação", text: "Tecnologia de ponta para rastrear preços." },
  { icon: "security", title: "Segurança", text: "Apenas lojas verificadas e confiáveis." },
  { icon: "groups", title: "Comunidade", text: "Milhares de usuários compartilhando dicas." },
];

const navItems = [
  { icon: "info", label: "Sobre Nós", id: "sobre", active: true },
  { icon: "verified_user", label: "Privacidade", id: "privacidade", active: false },
  { icon: "gavel", label: "Termos de Uso", id: "termos", active: false },
  { icon: "cookie", label: "Cookies", id: "cookies", active: false },
];

export default function Institutional() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
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
            <a href="/#tech" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tecnologia</a>
            <button onClick={() => navigate("/grupos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Grupos</button>
            <a href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex flex-1 justify-center py-8 px-4 md:px-8 lg:px-20 pt-24">
        <div className="flex flex-col max-w-[1200px] flex-1 gap-10">
          {/* Hero header */}
          <div className="flex flex-col gap-4 py-4 border-b border-border/50">
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
              Institucional e Legal
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Transparência é fundamental para nós. Aqui você encontra informações sobre nossa história, políticas de privacidade e termos de uso.
            </p>
          </div>

          {/* Grid: sidebar + content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
            {/* Sidebar nav */}
            <nav className="lg:col-span-3 flex flex-col gap-2 lg:sticky lg:top-24 h-fit">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 px-4">Navegação</p>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    item.active
                      ? "bg-secondary/10 text-secondary font-bold border-l-4 border-secondary"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground group"
                  }`}
                >
                  <MaterialIcon
                    name={item.icon}
                    className={`text-xl ${item.active ? "" : "group-hover:text-secondary transition-colors"}`}
                  />
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Main content */}
            <main className="lg:col-span-9 flex flex-col gap-10">
              {/* ─── SOBRE ─── */}
              <section id="sobre" className="bg-card/40 rounded-xl p-6 md:p-8 border border-border/50 backdrop-blur shadow-lg">
                {/* Cover image */}
                <div
                  className="w-full h-64 rounded-lg bg-cover bg-center mb-8 relative overflow-hidden border border-border/50"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDsz4b8QPTDbd3XIeUOm611jaogphTFzaZ4m1zDS6tqo1-ZXFRxNUFrfTzxQFkLdYUQuAwfGK2otj7bgVwsIMiguDLzz7szFbG9qCCKdIzLTHZq0RQX9RUJmjX5mMNLINF5zQUqkz9F7rVwWBAd2X9vTRYxmHGWyHx2wUwaXDCXuX4DPv7pRZdWKg35yLTG_KGka4fs2tquwytCaC6R8F5cFdHImZt5ki3H0u8lHLy9DAUpEXsCtnK1TSbsMlOiW0JFLTq78K4Rd2A')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent flex items-end p-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Nossa História</h2>
                      <p className="text-muted-foreground text-sm">Conectando pessoas às melhores oportunidades desde 2018</p>
                    </div>
                  </div>
                </div>

                <div className="max-w-none text-muted-foreground">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Sobre o Radar das Promos</h3>
                  <p className="mb-4 leading-relaxed">
                    O Radar das Promos nasceu de uma necessidade simples: encontrar descontos reais em um mar de ofertas duvidosas. Nossa missão é ajudar você a encontrar as melhores ofertas da internet com segurança e praticidade. Monitoramos centenas de lojas em tempo real, utilizando algoritmos avançados para verificar a veracidade dos descontos.
                  </p>
                  <p className="mb-6 leading-relaxed">
                    Acreditamos que comprar bem é um direito de todos. Por isso, nossa plataforma é e sempre será gratuita para os usuários. Trabalhamos incansavelmente para garantir que cada link clicado leve a uma economia real.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                    {pillars.map((p) => (
                      <div key={p.title} className="bg-background/50 p-4 rounded-lg border border-border/50">
                        <MaterialIcon name={p.icon} className="text-3xl text-secondary mb-2" />
                        <h4 className="font-bold text-foreground mb-1">{p.title}</h4>
                        <p className="text-sm">{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ─── PRIVACIDADE & TERMOS ─── */}
              <section id="privacidade" className="grid md:grid-cols-2 gap-6">
                <div className="bg-card/40 rounded-xl p-6 border border-border/50 backdrop-blur shadow-lg flex flex-col h-full hover:border-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <MaterialIcon name="lock" className="text-xl" />
                    </div>
                    <h3 className="text-xl font-bold">Privacidade</h3>
                  </div>
                  <p className="text-muted-foreground mb-6 flex-1">
                    Entenda como coletamos, usamos e protegemos seus dados pessoais. Sua privacidade é nossa prioridade absoluta. Seguimos rigorosamente a LGPD.
                  </p>
                  <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1 mt-auto group">
                    Ler política completa
                    <MaterialIcon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div id="termos" className="bg-card/40 rounded-xl p-6 border border-border/50 backdrop-blur shadow-lg flex flex-col h-full hover:border-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <MaterialIcon name="description" className="text-xl" />
                    </div>
                    <h3 className="text-xl font-bold">Termos de Uso</h3>
                  </div>
                  <p className="text-muted-foreground mb-6 flex-1">
                    As regras que regem o uso da nossa plataforma. Ao utilizar o Radar das Promos, você concorda com estas condições para garantir um ambiente seguro.
                  </p>
                  <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1 mt-auto group">
                    Ler termos completos
                    <MaterialIcon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>

              {/* ─── CTA / SUPORTE ─── */}
              <section id="cookies" className="bg-card/40 rounded-xl overflow-hidden relative border border-border/50">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-secondary/20 to-transparent pointer-events-none" />
                <div className="p-8 md:p-10 relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Precisa de ajuda jurídica ou suporte?</h3>
                  <p className="text-muted-foreground mb-6 max-w-xl">
                    Se você tiver dúvidas específicas sobre nossos termos ou como seus dados são tratados, nossa equipe de DPO (Data Protection Officer) está à disposição.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 px-6 rounded-lg transition-colors shadow-[var(--neon-glow)]">
                      <MaterialIcon name="mail" className="text-xl" />
                      Entrar em Contato
                    </button>
                    <button className="flex items-center gap-2 bg-transparent border border-border hover:bg-card/60 font-bold py-3 px-6 rounded-lg transition-colors">
                      Central de Ajuda
                    </button>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <PublicFooter />
    </div>
  );
}
