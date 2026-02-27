import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import PublicFooter from "@/components/PublicFooter";

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`}>{name}</span>;
}

// ─── Helpers ───

function getTrafficLight(count: number, max: number, isFull: boolean) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  if (isFull || pct >= 100)
    return { dot: "bg-red-500", glow: "shadow-[0_0_8px_#ef4444]", label: "Lista de Espera", text: "text-red-400" };
  if (pct >= 80)
    return { dot: "bg-yellow-500", glow: "shadow-[0_0_8px_#eab308]", label: "Últimas Vagas", text: "text-yellow-400" };
  return { dot: "bg-green-500", glow: "shadow-[0_0_8px_#22c55e]", label: "Vagas Abertas", text: "text-green-400" };
}

function formatMembers(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return v % 1 === 0 ? `${v}k` : `${v.toFixed(1)}k`;
  }
  return String(n);
}

const categoryImageMap: Record<string, string> = {
  Tech: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhNY72LfKZksZd-IVyeB-FXUjfqELwk09AEuawTiGW5Rot48tZgh_kcngKNrtFGWGCYxwmaaVqyyT3tzklcdK0SLKxrTu5mVZF75mZ1Q0Iv8-dEJd0CMupC1gDbE1SVUkBiuZIfPQ9K8tK4iAoh_gxzMao2Tk3BEsXt87JsTg1HB87OX4iK9zW3xTq7k2OglFF4gHsVJ7AYfjHystf18Pe--IMoAXcAFsm3YvxvnKHJIkIQ4eDkfzqkKJOl6xfKblPhxTE1-QBDfg",
  Casa: "https://lh3.googleusercontent.com/aida-public/AB6AXuALM6hsjARZJKKCUNaumrdmztw47-wS__diwuhYBuGBHHAtZ9kSKngJCSLm7RX9-hpW_bx0Huej6PpJJeZEg4_TeuK9zdxp8GllTdj006UGv4zqjOSBrfHI36J7u8y-JFM_ukO9GqpJGDXCwexFntTTGlk4-TyKZu_BpaifZHzeSFs4sQfdcN3KXQ1jNVo_mXGV40vFGh8UVYGWBElaWWsM2GT5AW5AKXBbdWGOiHrNvvYdmwjDg4f-3mud_te1WHI0qk1yMfnkoHk",
  Moda: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_XeQMP91SgqErP_8RDQB9Q43SQJ1ct2qFel-rx2twjYHzKMuZMjlUfaie8jWnMFuX723nbQwLfNY7uxZRWH9XBIe3kK2s7fRNE95CX8sELWyW1OYdO9ygLWxAu1eB14_fpKaY9iR8Nbw3wZNb4VRfEi1nXnyD3IVwY4oiHrFnJ9l_niggVnKAcj42vPzjma-FmDqSvflQwo68WaTwg017FOCdgOOWHW4C-K2sMMmFjK16NspACfQO_xQI-nmu1UXRsM9gPAELEf0",
  Geek: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgUExWKACGQ9G3UGpu052KEhwJzub9YEI5QdCPyxLvlmeCD0z0qG0TSpjsCCahY38rDhgnq89xuGowaYfMGsHcWy55Qc5zJByCbW-MAle4VSXV49UJimxCkWgQ8F1mjzu9Ux7jPfrJZRUze9zkvx-VwNF1Sbx1HnTONYLNeYbJ35vM4-JCA00xIla5B4gAhs1BZnvNRaH7FWvTLZdfdJEFULrg3Oiz7c8sfk7_AX0GEZIfCGZCSVcvZ18nbE30q9ZtWkxFaEdjO6s",
  Kids: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZyr7tllNSBKc-562yI1RZ_8mX0q_m8xcnq3sDfhAWRNf3uWJ3wQ7nR7F2dmjKKNiE6W6I5shKMbO1bowCK9lPjMhPqUxbGKkb7UWD23ksD7YDkztGuNawy3X-hQweQ5bDJT56UE5efHUOATAK33cJE8ghEU7QYoq_Nq1S-mUC4j9VcLmgv9Bcs-XHV6GsYJY4lPlcoKxtw5BrcBv0NZO002lNqMjLb9nytj9jD3oE1pLNgp0Zj5wvv2MMKhQXDFNyTJgl7YUg8fo",
  Relâmpago: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTOBnD9D7YAgV5JiibWbGnyNUa_smmNJjoWplQVap197IFSfia4lnuKm3NfWkKNcrW4Gwn0YaZ_Kl3cTyyXpkEYrBGOzBT4dBtlNZul7EcCRlHmenzQ4nunnNEAK99PziGLIhv_wVrkSGNjQZu6uT4em-TJ0LqygVRVUynYuUk_PwtEsHf4kusNUKrwRqv6fKAlcO3Gowgy8zCTKhXA5r9nBMn5qqe1Oi9PV92Z5ZJphkboeyYYVaAXGUF1GWwdPMwiP6ZRRrBGw",
};

const defaultImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTOBnD9D7YAgV5JiibWbGnyNUa_smmNJjoWplQVap197IFSfia4lnuKm3NfWkKNcrW4Gwn0YaZ_Kl3cTyyXpkEYrBGOzBT4dBtlNZul7EcCRlHmenzQ4nunnNEAK99PziGLIhv_wVrkSGNjQZu6uT4em-TJ0LqygVRVUynYuUk_PwtEsHf4kusNUKrwRqv6fKAlcO3Gowgy8zCTKhXA5r9nBMn5qqe1Oi9PV92Z5ZJphkboeyYYVaAXGUF1GWwdPMwiP6ZRRrBGw";

const categoryIconMap: Record<string, string> = {
  Tech: "devices",
  Casa: "chair",
  Moda: "styler",
  Geek: "sports_esports",
  Kids: "child_care",
  Relâmpago: "bolt",
};

export default function Groups() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["public-whatsapp-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("id, group_name, group_description, categories, participant_count, max_participants, is_full, invite_link, is_flash_deals_only, messages_sent, updated_at")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 1000 * 60 * 60,
  });

  // Build dynamic categories from data
  const dynamicCategories = (() => {
    const cats = new Set<string>();
    groups.forEach((g) => g.categories?.forEach((c) => cats.add(c)));
    // Add flash deals as "Relâmpago" if any
    if (groups.some((g) => g.is_flash_deals_only)) cats.add("Relâmpago");
    const arr = Array.from(cats).map((label) => ({ icon: categoryIconMap[label] || "", label }));
    return [{ icon: "", label: "Todos" }, ...arr];
  })();

  const filteredGroups = groups.filter((g) => {
    const groupCats = g.categories ?? [];
    const isFlash = g.is_flash_deals_only;
    const matchesCategory =
      activeCategory === "Todos" ||
      groupCats.includes(activeCategory) ||
      (activeCategory === "Relâmpago" && isFlash);
    const matchesSearch =
      !searchQuery ||
      g.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.group_description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCta = (g: (typeof groups)[0]) => {
    const tl = getTrafficLight(g.participant_count ?? 0, g.max_participants ?? 1024, !!g.is_full);
    if (tl.label === "Lista de Espera") {
      toast.success("Você será avisado quando abrir vaga!");
    } else if (g.invite_link) {
      window.open(g.invite_link, "_blank");
    } else {
      toast.info("Link de convite indisponível no momento.");
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

  const getImage = (g: (typeof groups)[0]) => {
    const cat = g.categories?.[0];
    if (g.is_flash_deals_only) return categoryImageMap["Relâmpago"] ?? defaultImage;
    return (cat ? categoryImageMap[cat] : undefined) ?? defaultImage;
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
            {dynamicCategories.map((cat) => (
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
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card/40">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-6 flex flex-col gap-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))
              : filteredGroups.map((g) => {
                  const pCount = g.participant_count ?? 0;
                  const maxP = g.max_participants ?? 1024;
                  const tl = getTrafficLight(pCount, maxP, !!g.is_full);
                  const isWaitlist = tl.label === "Lista de Espera";
                  
                  const image = getImage(g);

                  return (
                    <div
                      key={g.id}
                      className={`flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm group hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/10 ${
                        isWaitlist ? "hover:shadow-destructive/10" : ""
                      }`}
                    >
                      {/* Image Header */}
                      <div
                        className="h-40 w-full bg-cover bg-center relative"
                        style={{ backgroundImage: `url('${image}')` }}
                      >
                        <div className="absolute inset-0 bg-background/30 group-hover:bg-transparent transition-colors duration-300" />
                        {/* Member count + updated_at badges */}
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                          <div className="bg-background/80 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 border border-border/50">
                            <MaterialIcon name="group" className="text-[16px] text-primary" />
                            <span className="text-xs font-bold">{formatMembers(pCount)}</span>
                          </div>
                          {g.updated_at && (
                            <div className="bg-background/80 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-border/50">
                              <MaterialIcon name="schedule" className="text-[12px] text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(g.updated_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Category badge */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent flex items-end p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(g.categories?.length ? g.categories : ["Geral"]).map((cat) => (
                              <div
                                key={cat}
                                className={`text-xs font-bold px-2 py-1 rounded border border-border/30 backdrop-blur ${
                                  isWaitlist
                                    ? "bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/30"
                                    : "bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20"
                                }`}
                              >
                                {cat.toUpperCase()}
                              </div>
                            ))}
                            {g.is_flash_deals_only && (
                              <div className="text-xs font-bold px-2 py-1 rounded border border-border/30 backdrop-blur bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/30">
                                HOT
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 flex flex-col gap-4 flex-1">
                        <div>
                          <h3 className={`text-xl font-bold leading-tight mb-2 transition-colors ${isWaitlist ? "group-hover:text-destructive" : "group-hover:text-primary"}`}>
                            {g.group_name}
                          </h3>
                          <p className="text-muted-foreground text-sm">{g.group_description}</p>
                        </div>

                        {/* Frequency & Status with Traffic Light */}
                        <div className="flex items-center gap-4 py-3 border-t border-b border-border/30">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Mensagens</span>
                            <div className="flex items-center gap-1">
                              <MaterialIcon name="chat" className="text-[16px] text-primary" />
                              <span className="text-xs font-bold">{formatMembers(g.messages_sent ?? 0)}</span>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-border/30" />
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-3 w-3 rounded-full animate-pulse ${tl.dot} ${tl.glow}`} />
                              <span className={`text-xs font-bold ${tl.text}`}>{tl.label}</span>
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

          {/* Empty state */}
          {!isLoading && filteredGroups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MaterialIcon name="search_off" className="text-5xl mb-3" />
              <p className="text-lg font-medium">Nenhum grupo encontrado</p>
              <p className="text-sm">Tente outra categoria ou termo de busca.</p>
            </div>
          )}

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
