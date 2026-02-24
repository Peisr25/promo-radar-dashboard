import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, X } from "lucide-react";

export type SortOption = "discount" | "price" | "rating" | "recent" | "savings";
export type DiscountFilter = "all" | "30" | "50" | "70";
export type PriceTypeFilter = "all" | "PIX" | "Cartão/Boleto";
export type PriceRangeFilter = "all" | "0-50" | "50-100" | "100-500" | "500+";

interface ScrapeFiltersProps {
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  filterDiscount: DiscountFilter;
  onFilterDiscountChange: (v: DiscountFilter) => void;
  filterPriceType: PriceTypeFilter;
  onFilterPriceTypeChange: (v: PriceTypeFilter) => void;
  filterPriceRange: PriceRangeFilter;
  onFilterPriceRangeChange: (v: PriceRangeFilter) => void;
  filterCategory: string;
  onFilterCategoryChange: (v: string) => void;
  categories: string[];
  hideOpenBox: boolean;
  onHideOpenBoxChange: (v: boolean) => void;
  filteredCount: number;
  totalCount: number;
}

export function ScrapeFilters({
  sortBy, onSortChange,
  filterDiscount, onFilterDiscountChange,
  filterPriceType, onFilterPriceTypeChange,
  filterPriceRange, onFilterPriceRangeChange,
  filterCategory, onFilterCategoryChange,
  categories,
  hideOpenBox, onHideOpenBoxChange,
  filteredCount, totalCount,
}: ScrapeFiltersProps) {
  const hasFilters = filterDiscount !== "all" || filterPriceType !== "all" || filterPriceRange !== "all" || filterCategory !== "all" || hideOpenBox;

  const clearFilters = () => {
    onFilterDiscountChange("all");
    onFilterPriceTypeChange("all");
    onFilterPriceRangeChange("all");
    onFilterCategoryChange("all");
    onHideOpenBoxChange(false);
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Ordenar:</span>
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount">🔥 Maior Desconto</SelectItem>
            <SelectItem value="price">💰 Menor Preço</SelectItem>
            <SelectItem value="rating">⭐ Melhor Avaliação</SelectItem>
            <SelectItem value="recent">🕐 Mais Recente</SelectItem>
            <SelectItem value="savings">💵 Maior Economia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filtros:</span>

        <Select value={filterDiscount} onValueChange={(v) => onFilterDiscountChange(v as DiscountFilter)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Desconto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="30">≥ 30% OFF</SelectItem>
            <SelectItem value="50">≥ 50% OFF</SelectItem>
            <SelectItem value="70">≥ 70% OFF</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriceType} onValueChange={(v) => onFilterPriceTypeChange(v as PriceTypeFilter)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Tipo preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PIX">Apenas PIX</SelectItem>
            <SelectItem value="Cartão/Boleto">Apenas Cartão</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriceRange} onValueChange={(v) => onFilterPriceRangeChange(v as PriceRangeFilter)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Faixa preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="0-50">Até R$ 50</SelectItem>
            <SelectItem value="50-100">R$ 50 - R$ 100</SelectItem>
            <SelectItem value="100-500">R$ 100 - R$ 500</SelectItem>
            <SelectItem value="500+">Acima de R$ 500</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-open-box"
            checked={hideOpenBox}
            onCheckedChange={(checked) => onHideOpenBoxChange(checked === true)}
          />
          <label htmlFor="hide-open-box" className="text-sm cursor-pointer select-none">
            Ocultar Open Box
          </label>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="mr-1 h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredCount} de {totalCount} produtos
      </p>
    </div>
  );
}
