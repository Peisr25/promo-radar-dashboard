import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

export default function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/50 bg-card/30 pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-3 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20">
                <Radar className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-lg font-bold">Radar das Promos</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inteligência artificial monitorando preços em tempo real para você nunca mais pagar caro.
            </p>
          </div>

          {/* Plataforma */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Plataforma</h4>
            <button onClick={() => navigate("/como-funciona")} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-1.5">
              <MaterialIcon name="auto_awesome" className="text-base text-secondary" />
              Como Funciona
            </button>
            <button onClick={() => navigate("/grupos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-1.5">
              <MaterialIcon name="groups" className="text-base text-secondary" />
              Nossos Grupos
            </button>
            <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5 cursor-default">
              <MaterialIcon name="newspaper" className="text-base text-muted-foreground/50" />
              Blog de Ofertas (em breve)
            </span>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
            <button onClick={() => navigate("/institucional#termos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-1.5">
              <MaterialIcon name="gavel" className="text-base text-secondary" />
              Termos de Uso
            </button>
            <button onClick={() => navigate("/institucional#privacidade")} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-1.5">
              <MaterialIcon name="lock" className="text-base text-secondary" />
              Privacidade
            </button>
            <span className="text-sm text-muted-foreground/50 flex items-center gap-1.5 cursor-default">
              <MaterialIcon name="mail" className="text-base text-muted-foreground/50" />
              Contato (em breve)
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2024 Radar das Promos. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground/60 text-center sm:text-right max-w-md">
            Alguns links podem conter tags de afiliado. Isso não altera o preço final para você e nos ajuda a manter a plataforma gratuita.
          </p>
        </div>
      </div>
    </footer>
  );
}
