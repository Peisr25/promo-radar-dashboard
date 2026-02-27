

## Plano: Normalizar Categorias Existentes + Prevenir Duplicatas Futuras

### Problema Atual

Existem 46 categorias no banco, muitas duplicadas ou similares:

| Duplicata | Categoria Canonica |
|---|---|
| Bebês (8) | Bebê |
| Móveis (14) | Casa e Móveis (30) |
| Acessórios Automotivos (3) | Automotivo (5) |
| Alimentos (1) + Alimentos E Bebidas (1) | Alimentos e Bebidas |
| Câmeras E Segurança (2) + Segurança Eletrônica (1) | Segurança Eletrônica |
| Camping E Lazer (2) | Esporte e Lazer (8) |
| Higiene Pessoal (1) | Saúde e Cuidados Pessoais (5) |
| Limpeza E Lavanderia (1) + Produtos De Limpeza (5) | Produtos de Limpeza |
| Fones De Ouvido (13) + Áudio (4) | Áudio |
| Eletrônicos (1) | Informática (45) |

---

### O que sera feito

#### 1. Limpeza dos dados existentes (SQL UPDATE)

Executar UPDATE em massa no campo `metadata->>'categoria'` para renomear todas as duplicatas para a categoria canonica. Aproximadamente 10 UPDATE statements cobrindo ~50 registos.

#### 2. Adicionar mapa de normalizacao na Edge Function

Adicionar um dicionario `CATEGORY_ALIASES` na funcao `auto-categorize/index.ts` que mapeia variacoes conhecidas para a categoria canonica. Apos a IA retornar uma categoria, o sistema verifica se existe um alias e corrige automaticamente antes de salvar.

```text
CATEGORY_ALIASES = {
  "Bebês" -> "Bebê",
  "Móveis" -> "Casa e Móveis",
  "Eletrônicos" -> "Informática",
  "Acessórios Automotivos" -> "Automotivo",
  ...
}
```

#### 3. Expandir a lista BASE_CATEGORIES

Atualizar a lista base para incluir todas as categorias canonicas aprovadas (nao apenas as 9 originais), reduzindo a chance da IA inventar novas.

---

### Categorias canonicas finais (apos limpeza)

Smartphones, Eletrodomesticos, TV e Video, Informatica, Eletroportateis, Casa e Moveis, Beleza e Perfumaria, Moda, Outros, Automotivo, Audio, Bebe, Brinquedos, Cama Mesa e Banho, Colchoes, Esporte e Lazer, Ferramentas, Games, Leitores Digitais, Livros, Malas e Acessorios, Mercado, Papelaria, Produtos de Limpeza, Saude e Cuidados Pessoais, Smartwatches, Suplementos Alimentares, Utilidades Domesticas, Alimentos e Bebidas, Seguranca Eletronica, Ar e Ventilacao, Drones, Itens para Pet, Shopee Geral, Amazon Ofertas

### Detalhes Tecnicos

**Arquivos modificados:**
- `supabase/functions/auto-categorize/index.ts` -- adicionar CATEGORY_ALIASES + expandir BASE_CATEGORIES + aplicar normalizacao pos-IA

**Dados atualizados (via insert tool):**
- ~10 UPDATE statements na tabela `raw_scrapes` para renomear categorias duplicadas no campo JSONB `metadata`

