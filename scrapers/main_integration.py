"""
Exemplo de integração do AmazonScraper no main.py do FastAPI (Railway).

Este ficheiro mostra EXATAMENTE o código que deve ser adicionado ao seu
main.py existente no backend Railway. Copie os blocos relevantes.
"""

# ============================================================================
# BLOCO 1: Import (adicionar no topo do main.py)
# ============================================================================

from scrapers.amazon import AmazonScraper

# ============================================================================
# BLOCO 2: Função de background task (adicionar junto às outras funções)
# ============================================================================


def run_amazon_scrape(max_pages: int = 10, page_size: int = 30):
    """
    Executa o scraping da Amazon em background.
    Chamada pelo BackgroundTasks do FastAPI.
    """
    import logging

    logger = logging.getLogger("amazon_scrape_task")
    logger.info("Background task: iniciando scraping Amazon...")

    try:
        scraper = AmazonScraper()
        stats = scraper.scrape(max_pages=max_pages, page_size=page_size)
        logger.info("Background task: scraping Amazon finalizado. Stats: %s", stats)
    except Exception as e:
        logger.error("Background task: erro no scraping Amazon: %s", e)


# ============================================================================
# BLOCO 3: Endpoint (adicionar junto aos outros endpoints no main.py)
# ============================================================================

# Dentro do seu main.py existente, o endpoint /api/start-scrape já existe.
# Basta adicionar o case "amazon" no if/elif que despacha por site_name.
#
# Exemplo de como o endpoint deve ficar:

"""
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


class ScrapeRequest(BaseModel):
    source_id: Optional[str] = None
    site_name: str
    # Campos opcionais para Shopee
    app_id: Optional[str] = None
    app_secret: Optional[str] = None


@app.post("/api/start-scrape")
async def start_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    site = request.site_name.lower()

    if site == "magalu":
        # ... lógica existente do Magalu ...
        background_tasks.add_task(run_magalu_scrape, request.source_id)
        return {"status": "ok", "message": "Scraping Magalu iniciado em background"}

    elif site == "shopee":
        # ... lógica existente do Shopee ...
        background_tasks.add_task(run_shopee_scrape, request.app_id, request.app_secret)
        return {"status": "ok", "message": "Scraping Shopee iniciado em background"}

    elif site == "amazon":
        # >>> NOVO: Amazon scraper <<<
        background_tasks.add_task(run_amazon_scrape, max_pages=10, page_size=30)
        return {"status": "ok", "message": "Scraping Amazon iniciado em background"}

    else:
        return {"status": "error", "message": f"Site '{site}' não suportado"}
"""
