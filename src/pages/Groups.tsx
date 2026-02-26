import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PublicFooter from "@/components/PublicFooter";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

const categories = [
  { icon: "", label: "Todos" },
  { icon: "devices", label: "Tech" },
  { icon: "chair", label: "Casa" },
  { icon: "styler", label: "Moda" },
  { icon: "sports_esports", label: "Geek" },
  { icon: "child_care", label: "Kids" },
  { icon: "bolt", label: "Relâmpago" },
];

const groups = [
  {
    members: "12.5k",
    badge: "TECH",
    title: "Tech & Gadgets",
    desc: "Smartphones, notebooks, fones e periféricos.",
    freq: "Alta",
    freqIcon: "bolt",
    status: "Vagas Abertas",
    statusIcon: "check_circle",
    statusColor: "text-primary",
    category: "Tech",
    whatsappLink: "https://chat.whatsapp.com/tech-gadgets",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhNY72LfKZksZd-IVyeB-FXUjfqELwk09AEuawTiGW5Rot48tZgh_kcngKNrtFGWGCYxwmaaVqyyT3tzklcdK0SLKxrTu5mVZF75mZ1Q0Iv8-dEJd0CMupC1gDbE1SVUkBiuZIfPQ9K8tK4iAoh_gxzMao2Tk3BEsXt87JsTg1HB87OX4iK9zW3xTq7k2OglFF4gHsVJ7AYfjHystf18Pe--IMoAXcAFsm3YvxvnKHJIkIQ4eDkfzqkKJOl6xfKblPhxTE1-QBDfg",
  },
  {
    members: "8.2k",
    badge: "CASA",
    title: "Casa & Decoração",
    desc: "Eletrodomésticos, móveis e utilidades.",
    freq: "Média",
    freqIcon: "schedule",
    status: "Vagas Abertas",
    statusIcon: "check_circle",
    statusColor: "text-primary",
    category: "Casa",
    whatsappLink: "https://chat.whatsapp.com/casa-decoracao",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuALM6hsjARZJKKCUNaumrdmztw47-wS__diwuhYBuGBHHAtZ9kSKngJCSLm7RX9-hpW_bx0Huej6PpJJeZEg4_TeuK9zdxp8GllTdj006UGv4zqjOSBrfHI36J7u8y-JFM_ukO9GqpJGDXCwexFntTTGlk4-TyKZu_BpaifZHzeSFs4sQfdcN3KXQ1jNVo_mXGV40vFGh8UVYGWBElaWWsM2GT5AW5AKXBbdWGOiHrNvvYdmwjDg4f-3mud_te1WHI0qk1yMfnkoHk",
  },
  {
    members: "15k",
    badge: "MODA",
    title: "Moda & Estilo",
    desc: "Roupas, calçados e acessórios em promoção.",
    freq: "Alta",
    freqIcon: "bolt",
    status: "Últimas Vagas",
    statusIcon: "warning",
    statusColor: "text-yellow-400",
    category: "Moda",
    whatsappLink: "https://chat.whatsapp.com/moda-estilo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_XeQMP91SgqErP_8RDQB9Q43SQJ1ct2qFel-rx2twjYHzKMuZMjlUfaie8jWnMFuX723nbQwLfNY7uxZRWH9XBIe3kK2s7fRNE95CX8sELWyW1OYdO9ygLWxAu1eB14_fpKaY9iR8Nbw3wZNb4VRfEi1nXnyD3IVwY4oiHrFnJ9l_niggVnKAcj42vPzjma-FmDqSvflQwo68WaTwg017FOCdgOOWHW4C-K2sMMmFjK16NspACfQO_xQI-nmu1UXRsM9gPAELEf0",
  },
  {
    members: "6.8k",
    badge: "GEEK",
    title: "Mundo Geek",
    desc: "Jogos, HQs, colecionáveis e cultura pop.",
    freq: "Média",
    freqIcon: "schedule",
    status: "Vagas Abertas",
    statusIcon: "check_circle",
    statusColor: "text-primary",
    category: "Geek",
    whatsappLink: "https://chat.whatsapp.com/mundo-geek",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgUExWKACGQ9G3UGpu052KEhwJzub9YEI5QdCPyxLvlmeCD0z0qG0TSpjsCCahY38rDhgnq89xuGowaYfMGsHcWy55Qc5zJByCbW-MAle4VSXV49UJimxCkWgQ8F1mjzu9Ux7jPfrJZRUze9zkvx-VwNF1Sbx1HnTONYLNeYbJ35vM4-JCA00xIla5B4gAhs1BZnvNRaH7FWvTLZdfdJEFULrg3Oiz7c8sfk7_AX0GEZIfCGZCSVcvZ18nbE30q9ZtWkxFaEdjO6s",
  },
  {
    members: "22k",
    badge: "HOT",
    title: "Promoções Relâmpago",
    desc: "Erros de preço, cupons limitados e ofertas rápidas.",
    freq: "Muito Alta",
    freqIcon: "local_fire_department",
    status: "Lista de Espera",
    statusIcon: "lock",
    statusColor: "text-destructive",
    category: "Relâmpago",
    whatsappLink: "",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTOBnD9D7YAgV5JiibWbGnyNUa_smmNJjoWplQVap197IFSfia4lnuKm3NfWkKNcrW4Gwn0YaZ_Kl3cTyyXpkEYrBGOzBT4dBtlNZul7EcCRlHmenzQ4nunnNEAK99PziGLIhv_wVrkSGNjQZu6uT4em-TJ0LqygVRVUynYuUk_PwtEsHf4kusNUKrwRqv6fKAlcO3Gowgy8zCTKhXA5r9nBMn5qqe1Oi9PV92Z5ZJphkboeyYYVaAXGUF1GWwdPMwiP6ZRRrBGw",
  },
  {
    members: "5.4k",
    badge: "KIDS",
    title: "Universo Kids",
    desc: "Brinquedos, fraldas e roupas infantis.",
    freq: "Média",
    freqIcon: "schedule",
    status: "Vagas Abertas",
    statusIcon: "check_circle",
    statusColor: "text-primary",
    category: "Kids",
    whatsappLink: "https://chat.whatsapp.com/universo-kids",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZyr7tllNSBKc-562yI1RZ_8mX0q_m8xcnq3sDfhAWRNf3uWJ3wQ7nR7F2dmjKKNiE6W6I5shKMbO1bowCK9lPjMhPqUxbGKkb7UWD23ksD7YDkztGuNawy3X-hQweQ5bDJT56UE5efHUOATAK33cJE8ghEU7QYoq_Nq1S-mUC4j9VcLmgv9Bcs-XHV6GsYJY4lPlcoKxtw5BrcBv0NZO002lNqMjLb9nytj9jD3oE1pLNgp0Zj5wvv2MMKhQXDFNyTJgl7YUg8fo",
  },
];

export default function Groups() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");

  const filteredGroups = groups.filter((g) => {
    const matchesCategory = activeCategory === "Todos" || g.category === activeCategory;
    const matchesSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCta = (g: (typeof groups)[0]) => {
    if (g.status === "Lista de Espera") {
      toast.success("Você será avisado quando abrir vaga!");
    } else {
      window.open(g.whatsappLink, "_blank");
    }
  };

  const handleNewsletter = () => {
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    toast.success("Inscrição realizada com sucesso!");
    setEmail("");
  };

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
            <button className="text-sm text-foreground font-bold border-b-2 border-secondary pb-0.5">Grupos</button>
            <a href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Segurança</a>
          </div>
          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10" onClick={() => navigate("/admin")}>
            Entrar
          </Button>
        </div>
      </nav>

      {/* ─── MAIN ─── */}
      <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-10 pt-28 pb-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full bg-secondary/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

        <div className="flex flex-col max-w-[1200px] w-full gap-8 z-10">
          {/* ─── HERO ─── */}
          <div className="flex flex-col gap-4 text-center items-center mb-6">
            <div className="inline-flex items-center rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary mb-2">
              <span className="flex h-2 w-2 rounded-full bg-secondary mr-2 animate-pulse" />
              Vagas disponíveis hoje
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Escolha seu <span className="text-secondary">nicho</span> de economia
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Entre nos grupos VIP que mais combinam com seu perfil de consumo. Monitoramento em tempo real com curadoria humana e bots inteligentes.
            </p>
          </div>

          {/* ─── SEARCH ─── */}
          <div className="w-full max-w-xl mx-auto">
            <label className="flex h-14 w-full relative group">
              <div className="flex w-full flex-1 items-stretch rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-secondary/50 focus-within:border-secondary overflow-hidden">
                <div className="text-secondary flex items-center justify-center pl-4 pr-2">
                  <MaterialIcon name="search" className="text-2xl" />
                </div>
                <input
                  className="flex w-full min-w-0 flex-1 resize-none bg-transparent text-foreground focus:outline-none h-full placeholder:text-muted-foreground px-2 text-base border-none focus:ring-0"
                  placeholder="Buscar grupos (ex: Tech, Casa, Moda...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* ─── CATEGORY PILLS ─── */}
          <div className="flex gap-3 flex-wrap justify-center">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex h-10 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.label
                    ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 border border-secondary font-bold"
                    : "border border-border/50 bg-card/40 backdrop-blur-sm text-muted-foreground hover:bg-card/60 hover:text-foreground"
                }`}
              >
                {cat.icon && <MaterialIcon name={cat.icon} className="text-[18px]" />}
                {cat.label}
              </button>
            ))}
          </div>

          {/* ─── GROUPS GRID ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredGroups.map((g) => {
              const isWaitlist = g.status === "Lista de Espera";
              return (
                <div
                  key={g.title}
                  className={`flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm group hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/10 ${
                    isWaitlist ? "hover:shadow-destructive/10" : ""
                  }`}
                >
                  {/* Image Header */}
                  <div
                    className="h-40 w-full bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${g.image}')` }}
                  >
                    <div className="absolute inset-0 bg-background/30 group-hover:bg-transparent transition-colors duration-300" />
                    {/* Member count badge */}
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 border border-border/50">
                      <MaterialIcon name="group" className="text-[16px] text-primary" />
                      <span className="text-xs font-bold">{g.members}</span>
                    </div>
                    {/* Category badge on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent flex items-end p-4">
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded border border-border/30 backdrop-blur ${
                          isWaitlist
                            ? "bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/30"
                            : "bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20"
                        }`}
                      >
                        {g.badge}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div>
                      <h3 className={`text-xl font-bold leading-tight mb-2 transition-colors ${isWaitlist ? "group-hover:text-destructive" : "group-hover:text-primary"}`}>
                        {g.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">{g.desc}</p>
                    </div>

                    {/* Frequency & Status */}
                    <div className="flex items-center gap-4 py-3 border-t border-b border-border/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Frequência</span>
                        <div className="flex items-center gap-1">
                          <MaterialIcon name={g.freqIcon} className={`text-[16px] ${isWaitlist ? "text-destructive" : "text-primary"}`} />
                          <span className="text-xs font-bold">{g.freq}</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border/30" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                        <div className="flex items-center gap-1">
                          <MaterialIcon name={g.statusIcon} className={`text-[16px] ${g.statusColor}`} />
                          <span className="text-xs font-bold">{g.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    {isWaitlist ? (
                      <button
                        onClick={() => handleCta(g)}
                        className="mt-auto flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-muted/50 text-muted-foreground font-bold text-sm uppercase tracking-wider gap-2 hover:bg-muted transition-colors"
                      >
                        <MaterialIcon name="notifications_active" className="text-[20px]" />
                        <span>Avisar Vaga</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCta(g)}
                        className="mt-auto flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider transition-all duration-300 gap-2 hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                      >
                        <MaterialIcon name="chat" className="text-[20px]" />
                        <span>Entrar Agora</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── NEWSLETTER ─── */}
          <div className="mt-12 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden group">
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors duration-500" />
            <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />
            <div className="flex flex-col gap-3 max-w-lg z-10">
              <h2 className="text-2xl md:text-3xl font-bold">Não encontrou o que procurava?</h2>
              <p className="text-muted-foreground">Temos novos grupos abrindo toda semana. Inscreva-se na nossa newsletter para ser avisado primeiro.</p>
            </div>
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3 z-10">
              <input
                className="flex w-full md:w-72 min-w-0 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 bg-background/40 placeholder:text-muted-foreground px-4 py-3 text-sm"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewsletter()}
              />
              <button
                onClick={handleNewsletter}
                className="flex whitespace-nowrap min-w-[120px] cursor-pointer items-center justify-center rounded-xl px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-sm transition-all duration-300 shadow-lg shadow-secondary/20"
              >
                Me avisar
              </button>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
