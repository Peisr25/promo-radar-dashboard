

# Atualizar Frontend para Novos Campos do raw_scrapes

## Contexto
A tabela `raw_scrapes` ja possui todas as colunas necessarias (`old_price`, `discount_percentage`, `rating`, `installments`, `price_type`, `metadata`). Nenhuma migracao e necessaria. Apenas o frontend precisa ser atualizado para exibir esses dados.

---

## Alteracoes

### 1. ScraperLogs.tsx - Tabela com todos os campos

- Atualizar a interface `RawScrape` para incluir: `old_price`, `discount_percentage`, `rating`, `installments`, `price_type`
- Adicionar colunas na tabela: Preco Antigo, Desconto, Avaliacao, Parcelamento, Tipo
- Exibir preco antigo riscado ao lado do preco atual
- Badge colorido para percentagem de desconto
- Usar scroll horizontal para acomodar as colunas extras

### 2. Pipeline.tsx - Cards com informacao completa

- Atualizar a interface `RawScrape` com os mesmos campos novos
- Nos cards de "Novos Achados":
  - Mostrar preco antigo riscado acima do preco atual
  - Badge com percentagem de desconto (ex: "-34%")
  - Avaliacao com estrela (ex: "4.7")
  - Tipo de preco (PIX/Cartao)
  - Parcelamento abaixo do preco
- Ao processar promocao, mapear `old_price` para `original_price` na tabela `promotions`

---

## Detalhes Tecnicos

- Ambos os ficheiros usam uma interface local `RawScrape` que precisa dos campos adicionais
- O `processPromotion` no Pipeline.tsx passara a incluir `original_price: scrape.old_price` ao inserir na tabela `promotions`
- Nenhuma migracao SQL necessaria - as colunas ja existem na base de dados
