import requests
from datetime import datetime, timezone
from urllib.parse import quote

from config.settings import (
    DEFAULT_REQUEST_HEADERS,
    DEFAULT_REQUEST_TIMEOUT,
    WIKIPEDIA_SEARCH_URL,
    WIKIPEDIA_SUMMARY_URL,
    WIKIPEDIA_MAX_ATTEMPTS,
    WIKIPEDIA_MAX_RETRY_DELAY_SECONDS,
)
from models.research_data import ResearchData, ResearchSource
from utils.keywords import extract_keywords
from utils.retries import call_with_retry, retry_after_seconds


def _get(url: str, *, params: dict | None = None):
    """Make one Wikipedia request with bounded retries for network and transient HTTP errors."""
    def request():
        return requests.get(
            url,
            params=params,
            headers=DEFAULT_REQUEST_HEADERS,
            timeout=DEFAULT_REQUEST_TIMEOUT,
        )

    response = call_with_retry(
        request,
        retryable_exception=lambda exc: isinstance(
            exc, (requests.Timeout, requests.ConnectionError)
        ),
        retryable_result=lambda result: (
            result.status_code in {408, 429} or 500 <= result.status_code < 600
        ),
        retry_after=lambda result: retry_after_seconds(result.headers.get("Retry-After")),
        attempts=WIKIPEDIA_MAX_ATTEMPTS,
        max_delay=WIKIPEDIA_MAX_RETRY_DELAY_SECONDS,
    )
    response.raise_for_status()
    return response


def fetch_wikipedia_context(tema: str) -> ResearchData | None:
    """Busca até cinco páginas da Wikipédia em português e converte resumos válidos em fontes identificadas. Retorna `None` quando não há material utilizável ou a consulta falha."""
    keywords = " ".join(extract_keywords(tema)) or tema
    params = {
        "action": "query",
        "list": "search",
        "srsearch": keywords,
        "format": "json",
        "srlimit": 5,
    }

    try:
        response_busca = _get(WIKIPEDIA_SEARCH_URL, params=params)
        data_busca = response_busca.json()
        resultados = data_busca.get("query", {}).get("search", [])

        if not resultados:
            return None

        fontes: list[ResearchSource] = []
        for resultado in resultados:
            titulo_resultado = resultado.get("title")
            if not titulo_resultado:
                continue

            summary_url = (
                f"{WIKIPEDIA_SUMMARY_URL}/"
                f"{quote(titulo_resultado.replace(' ', '_'), safe='')}"
            )
            try:
                response_sumario = _get(summary_url)
                resumo = response_sumario.json()
            except (requests.RequestException, ValueError):
                continue

            if not isinstance(resumo, dict):
                continue
            trecho = resumo.get("extract") or ""
            content_urls = resumo.get("content_urls") or {}
            desktop_url = content_urls.get("desktop") or {}
            url = desktop_url.get("page")
            if not trecho or not url:
                continue

            metadata_fields = (
                "pageid", "description", "lang", "dir", "timestamp", "displaytitle",
                "thumbnail", "originalimage", "coordinates", "type", "wikibase_item",
            )
            metadata = {
                key: resumo[key]
                for key in metadata_fields
                if resumo.get(key) is not None
            }
            fontes.append(ResearchSource(
                id=f"fonte_{len(fontes) + 1:02d}",
                title=resumo.get("title") or titulo_resultado,
                url=url,
                extract=trecho,
                consulted_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                metadata=metadata,
            ))

        if not fontes:
            return None

        return ResearchData(
            title=fontes[0].title,
            resumo_wiki="\n\n".join(
                f"[{source.id}] {source.title}: {source.extract}" for source in fontes
            ),
            keywords=extract_keywords(tema),
            fontes=fontes,
            query=tema,
        )
    except (requests.RequestException, ValueError) as exc:
        print(f"[ERRO] Falha ao consultar a Wikipedia ({type(exc).__name__}).")
        return None
