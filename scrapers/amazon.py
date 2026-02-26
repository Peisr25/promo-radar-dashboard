"""
Amazon Brasil Scraper — Promo Radar
Extrai ofertas via API interna oculta da Amazon (d2b/api/v1/products/search).

Técnicas de evasão:
- Proxies rotativos Webshare (mesmo padrão do magalu.py)
- Spoofing dinâmico de headers (User-Agent, Sec-Ch-Ua, etc.)
- TLS Fingerprinting via curl_cffi (impersonate Chrome/Edge)
- Pacing com atrasos aleatórios
- Retry com backoff exponencial
"""

import os
import json
import time
import random
import logging
from typing import Optional
from datetime import datetime, timezone

import requests

try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

logger = logging.getLogger("amazon_scraper")

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

AMAZON_API_URL = "https://www.amazon.com.br/d2b/api/v1/products/search"

AFFILIATE_TAG = os.getenv("AMAZON_AFFILIATE_TAG", "promodarar-20")

# Browsers que o curl_cffi pode impersonar para TLS fingerprinting
IMPERSONATE_BROWSERS = [
    "chrome120",
    "chrome119",
    "chrome116",
    "edge101",
    "edge99",
]

# Pool de User-Agents realistas (Windows + macOS, Chrome/Edge/Opera)
USER_AGENTS = [
    # Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    # Edge Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    # Opera GX Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
    # Chrome macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

# Sec-Ch-Ua que correspondem aos User-Agents acima
SEC_CH_UA_OPTIONS = [
    '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    '"Not_A Brand";v="8", "Chromium";v="119", "Google Chrome";v="119"',
    '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"',
    '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    '"Not_A Brand";v="8", "Chromium";v="119", "Microsoft Edge";v="119"',
    '"Not_A Brand";v="8", "Chromium";v="120", "Opera GX";v="106"',
    '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    '"Not_A Brand";v="8", "Chromium";v="119", "Google Chrome";v="119"',
]

ACCEPT_LANGUAGES = [
    "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "pt-BR,pt;q=0.9,en;q=0.8",
    "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6",
    "pt-BR,pt;q=0.8,en-US;q=0.6,en;q=0.4",
]


# ---------------------------------------------------------------------------
# Classe AmazonScraper
# ---------------------------------------------------------------------------

class AmazonScraper:
    """
    Scraper para a API interna de ofertas da Amazon Brasil.

    Usa proxies rotativos Webshare, spoofing de headers, TLS fingerprinting
    via curl_cffi e pacing com atrasos aleatórios.
    """

    def __init__(self):
        # --- Supabase (REST direto, sem SDK) ---
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        # --- Proxies Webshare (mesmo padrão do magalu.py) ---
        self.proxy_list: list[str] = []
        self._proxy_index = 0
        self._load_proxies()

        # --- Estatísticas ---
        self.stats = {
            "pages_fetched": 0,
            "products_found": 0,
            "products_saved": 0,
            "errors": 0,
        }

    # -----------------------------------------------------------------------
    # Proxy Management (clone da lógica do magalu.py)
    # -----------------------------------------------------------------------

    def _load_proxies(self) -> None:
        """
        Carrega proxies do Webshare.
        Suporta dois formatos de configuração:
        1. WEBSHARE_PROXY_URL — URL única do Webshare rotating proxy
           Ex: http://user-pass:pass@p.webshare.io:80
        2. WEBSHARE_API_KEY — busca lista de proxies via API do Webshare
        3. WEBSHARE_PROXY_LIST — lista separada por vírgula
           Ex: http://user:pass@ip1:port,http://user:pass@ip2:port
        """
        # Opção 1: URL de rotating proxy (mais simples)
        rotating_url = os.getenv("WEBSHARE_PROXY_URL")
        if rotating_url:
            self.proxy_list = [rotating_url]
            logger.info("Webshare: usando rotating proxy URL")
            return

        # Opção 2: Lista manual de proxies
        proxy_list_raw = os.getenv("WEBSHARE_PROXY_LIST", "")
        if proxy_list_raw:
            self.proxy_list = [p.strip() for p in proxy_list_raw.split(",") if p.strip()]
            logger.info("Webshare: carregadas %d proxies da env WEBSHARE_PROXY_LIST", len(self.proxy_list))
            return

        # Opção 3: API key do Webshare para buscar lista
        api_key = os.getenv("WEBSHARE_API_KEY")
        if api_key:
            self._fetch_proxies_from_webshare_api(api_key)
            return

        logger.warning("Nenhuma proxy configurada. Requisições irão sem proxy (risco alto de bloqueio).")

    def _fetch_proxies_from_webshare_api(self, api_key: str) -> None:
        """Busca a lista de proxies ativas via API do Webshare."""
        try:
            resp = requests.get(
                "https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=100",
                headers={"Authorization": f"Token {api_key}"},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            for p in results:
                proxy_url = (
                    f"http://{p['username']}:{p['password']}@"
                    f"{p['proxy_address']}:{p['port']}"
                )
                self.proxy_list.append(proxy_url)
            logger.info("Webshare API: carregadas %d proxies", len(self.proxy_list))
        except Exception as e:
            logger.error("Falha ao carregar proxies do Webshare API: %s", e)

    def _get_next_proxy(self) -> Optional[dict]:
        """Retorna o próximo proxy da lista num esquema round-robin."""
        if not self.proxy_list:
            return None
        proxy_url = self.proxy_list[self._proxy_index % len(self.proxy_list)]
        self._proxy_index += 1
        return {"http": proxy_url, "https": proxy_url}

    # -----------------------------------------------------------------------
    # Header Spoofing
    # -----------------------------------------------------------------------

    def _build_headers(self) -> dict:
        """
        Gera headers spoofados dinamicamente para cada requisição,
        imitando um browser real a navegar na Amazon Brasil.
        """
        idx = random.randint(0, len(USER_AGENTS) - 1)
        ua = USER_AGENTS[idx]
        sec_ch_ua = SEC_CH_UA_OPTIONS[idx]
        accept_lang = random.choice(ACCEPT_LANGUAGES)

        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": accept_lang,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Host": "www.amazon.com.br",
            "Origin": "https://www.amazon.com.br",
            "Referer": "https://www.amazon.com.br/deals",
            "Sec-Ch-Ua": sec_ch_ua,
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": ua,
            "Pragma": "no-cache",
            "X-Requested-With": "XMLHttpRequest",
        }

        # Adicionar cookies da sessão se configurados
        session_cookies = os.getenv("AMAZON_SESSION_COOKIES", "")
        if session_cookies:
            headers["Cookie"] = session_cookies

        return headers

    # -----------------------------------------------------------------------
    # Requisição com Evasão (TLS fingerprint + proxy + retry)
    # -----------------------------------------------------------------------

    def _make_request(self, url: str, params: dict, max_retries: int = 3) -> Optional[dict]:
        """
        Faz uma requisição GET com:
        - TLS fingerprinting via curl_cffi (se disponível)
        - Proxy rotativo Webshare
        - Headers spoofados
        - Retry com backoff exponencial
        """
        for attempt in range(max_retries):
            headers = self._build_headers()
            proxy_dict = self._get_next_proxy()

            try:
                if HAS_CURL_CFFI:
                    # curl_cffi impersona o TLS fingerprint de um browser real
                    browser = random.choice(IMPERSONATE_BROWSERS)
                    response = cffi_requests.get(
                        url,
                        params=params,
                        headers=headers,
                        proxies=proxy_dict,
                        impersonate=browser,
                        timeout=30,
                    )
                else:
                    response = requests.get(
                        url,
                        params=params,
                        headers=headers,
                        proxies=proxy_dict,
                        timeout=30,
                    )

                if response.status_code == 200:
                    return response.json()

                if response.status_code == 503:
                    logger.warning(
                        "AWS WAF challenge (503) na tentativa %d/%d. Rotando proxy...",
                        attempt + 1, max_retries,
                    )
                elif response.status_code == 429:
                    logger.warning(
                        "Rate limited (429) na tentativa %d/%d. Aumentando delay...",
                        attempt + 1, max_retries,
                    )
                else:
                    logger.warning(
                        "Status %d na tentativa %d/%d",
                        response.status_code, attempt + 1, max_retries,
                    )

            except Exception as e:
                logger.error(
                    "Erro na requisição (tentativa %d/%d): %s",
                    attempt + 1, max_retries, e,
                )

            # Backoff exponencial com jitter
            backoff = (2 ** attempt) + random.uniform(1.0, 3.0)
            logger.info("Aguardando %.1fs antes de re-tentar...", backoff)
            time.sleep(backoff)

        logger.error("Todas as %d tentativas falharam para %s", max_retries, url)
        self.stats["errors"] += 1
        return None

    # -----------------------------------------------------------------------
    # Extração e Normalização dos Dados
    # -----------------------------------------------------------------------

    def _extract_products(self, data: dict) -> list[dict]:
        """
        Extrai e normaliza os produtos do JSON retornado pela API da Amazon.

        Campos extraídos:
        - product_title: de title
        - original_url: montado com asin + tag de afiliado
        - image_url: de image.hiRes.baseUrl
        - price: de price.priceToPay.price
        - old_price: de price.basisPrice.price
        - discount_percentage: calculado ou de dealBadge
        """
        products = []
        results = data.get("results", data.get("dealDetails", []))

        # A API pode retornar os produtos em diferentes chaves
        if isinstance(results, dict):
            results = list(results.values())

        for item in results:
            try:
                product = self._parse_product(item)
                if product:
                    products.append(product)
            except Exception as e:
                logger.debug("Erro ao parsear produto: %s", e)
                continue

        return products

    def _parse_product(self, item: dict) -> Optional[dict]:
        """Parseia um único item do JSON da Amazon."""
        # Título
        title = item.get("title", "")
        if not title:
            title = item.get("dealTitle", "")
        if not title:
            return None

        # ASIN
        asin = item.get("asin", "")
        if not asin:
            asin = item.get("dealID", "")

        # URL com tag de afiliado
        original_url = f"https://www.amazon.com.br/dp/{asin}?tag={AFFILIATE_TAG}" if asin else ""

        # Imagem
        image_url = ""
        image_data = item.get("image", {})
        if isinstance(image_data, dict):
            hi_res = image_data.get("hiRes", {})
            if isinstance(hi_res, dict):
                image_url = hi_res.get("baseUrl", "")
            if not image_url:
                image_url = image_data.get("url", "")
        elif isinstance(image_data, str):
            image_url = image_data

        # Preço atual
        price = self._extract_price(item, "priceToPay")
        # Preço original
        old_price = self._extract_price(item, "basisPrice")

        # Desconto
        discount_percentage = self._calculate_discount(item, price, old_price)

        # Só salva se tiver pelo menos título e preço
        if not price and not old_price:
            return None

        return {
            "product_title": title.strip(),
            "original_url": original_url,
            "image_url": image_url,
            "price": price,
            "old_price": old_price,
            "discount_percentage": discount_percentage,
            "source": "amazon",
            "metadata": {
                "category": "Amazon Ofertas",
                "asin": asin,
            },
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

    def _extract_price(self, item: dict, price_key: str) -> Optional[float]:
        """Extrai preço de um nó específico do JSON."""
        price_data = item.get("price", {})
        if not isinstance(price_data, dict):
            return None

        node = price_data.get(price_key, {})
        if not isinstance(node, dict):
            return None

        raw_price = node.get("price")
        if raw_price is None:
            raw_price = node.get("amount")

        if raw_price is None:
            return None

        # Pode vir como string "R$ 199,90" ou como float
        if isinstance(raw_price, (int, float)):
            return float(raw_price)

        if isinstance(raw_price, str):
            cleaned = (
                raw_price
                .replace("R$", "")
                .replace("\xa0", "")
                .replace(".", "")
                .replace(",", ".")
                .strip()
            )
            try:
                return float(cleaned)
            except ValueError:
                return None

        return None

    def _calculate_discount(
        self, item: dict, price: Optional[float], old_price: Optional[float]
    ) -> Optional[float]:
        """Calcula a percentagem de desconto."""
        # Tentar extrair do dealBadge primeiro
        badge = item.get("dealBadge", {})
        if isinstance(badge, dict):
            pct = badge.get("percentage")
            if pct is not None:
                try:
                    return float(str(pct).replace("%", "").strip())
                except ValueError:
                    pass

        # Calcular manualmente
        if price and old_price and old_price > price:
            return round(((old_price - price) / old_price) * 100, 1)

        return None

    # -----------------------------------------------------------------------
    # Persistência — Supabase REST direto (sem SDK)
    # -----------------------------------------------------------------------

    def _save_to_supabase(self, products: list[dict]) -> int:
        """
        Faz upsert dos produtos na tabela raw_scrapes via REST API do Supabase.
        Usa on_conflict=original_url e Prefer: resolution=merge-duplicates.
        Retorna o número de produtos salvos.
        """
        if not products:
            return 0

        if not self.supabase_url or not self.supabase_key:
            logger.error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados")
            return 0

        url = f"{self.supabase_url}/rest/v1/raw_scrapes?on_conflict=original_url"

        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Prefer": "return=representation,resolution=merge-duplicates",
        }

        # Formatar para o schema da tabela raw_scrapes
        rows = []
        for p in products:
            rows.append({
                "product_title": p["product_title"],
                "original_url": p["original_url"],
                "image_url": p["image_url"],
                "price": p["price"],
                "old_price": p["old_price"],
                "discount_percentage": p["discount_percentage"],
                "source": p["source"],
                "metadata": json.dumps(p["metadata"]) if isinstance(p["metadata"], dict) else p["metadata"],
                "scraped_at": p["scraped_at"],
            })

        saved = 0
        # Enviar em lotes de 50 para evitar payloads enormes
        batch_size = 50
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            try:
                resp = requests.post(url, headers=headers, json=batch, timeout=30)
                if resp.status_code in (200, 201):
                    result = resp.json()
                    saved += len(result) if isinstance(result, list) else 1
                    logger.info("Lote %d: %d produtos salvos", (i // batch_size) + 1, len(batch))
                else:
                    logger.error(
                        "Erro ao salvar lote %d: status=%d body=%s",
                        (i // batch_size) + 1, resp.status_code, resp.text[:500],
                    )
                    self.stats["errors"] += 1
            except Exception as e:
                logger.error("Exceção ao salvar lote %d: %s", (i // batch_size) + 1, e)
                self.stats["errors"] += 1

        return saved

    # -----------------------------------------------------------------------
    # Scraping Principal
    # -----------------------------------------------------------------------

    def scrape(
        self,
        max_pages: int = 10,
        page_size: int = 30,
        min_delay: float = 2.0,
        max_delay: float = 6.0,
    ) -> dict:
        """
        Executa o scraping completo da Amazon Brasil.

        Args:
            max_pages: Número máximo de páginas a buscar.
            page_size: Itens por página (máx 30 na API da Amazon).
            min_delay: Atraso mínimo entre requests (segundos).
            max_delay: Atraso máximo entre requests (segundos).

        Returns:
            Dict com estatísticas da execução.
        """
        logger.info("=== Iniciando scraping Amazon Brasil ===")
        logger.info("Max pages: %d | Page size: %d | Proxies: %d", max_pages, page_size, len(self.proxy_list))

        if HAS_CURL_CFFI:
            logger.info("TLS Fingerprinting: ATIVO (curl_cffi)")
        else:
            logger.warning("TLS Fingerprinting: INATIVO (curl_cffi não instalado, usando requests)")

        all_products = []

        for page in range(max_pages):
            start_index = page * page_size

            params = {
                "pageSize": page_size,
                "startIndex": start_index,
            }

            logger.info("Buscando página %d (startIndex=%d)...", page + 1, start_index)

            data = self._make_request(AMAZON_API_URL, params)

            if not data:
                logger.warning("Página %d: sem dados. Encerrando paginação.", page + 1)
                break

            self.stats["pages_fetched"] += 1

            products = self._extract_products(data)
            logger.info("Página %d: %d produtos extraídos", page + 1, len(products))

            if not products:
                logger.info("Nenhum produto na página %d. Fim da paginação.", page + 1)
                break

            all_products.extend(products)
            self.stats["products_found"] += len(products)

            # Pacing — delay aleatório para simular navegação humana
            if page < max_pages - 1:
                delay = random.uniform(min_delay, max_delay)
                logger.info("Aguardando %.1fs antes da próxima página...", delay)
                time.sleep(delay)

        # Salvar no Supabase
        if all_products:
            logger.info("Salvando %d produtos no Supabase...", len(all_products))
            saved = self._save_to_supabase(all_products)
            self.stats["products_saved"] = saved

        logger.info("=== Scraping Amazon finalizado ===")
        logger.info(
            "Estatísticas: %d páginas | %d encontrados | %d salvos | %d erros",
            self.stats["pages_fetched"],
            self.stats["products_found"],
            self.stats["products_saved"],
            self.stats["errors"],
        )

        return self.stats


# ---------------------------------------------------------------------------
# Execução direta (para testes locais)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )
    scraper = AmazonScraper()
    result = scraper.scrape(max_pages=3, page_size=30)
    print(json.dumps(result, indent=2))
