"""Cliente HTTP limitado e reutilizável para os adaptadores de fontes."""

from __future__ import annotations

from typing import Any

import requests

from config.settings import (
    DEFAULT_REQUEST_HEADERS,
    DEFAULT_REQUEST_TIMEOUT,
    WIKIPEDIA_MAX_ATTEMPTS,
    WIKIPEDIA_MAX_RETRY_DELAY_SECONDS,
)
from utils.retries import call_with_retry, retry_after_seconds


class SourceHttpClient:
    """Executa GETs com timeout e repetição somente para falhas transitórias."""

    def __init__(self, session: requests.Session | None = None) -> None:
        self.session = session or requests.Session()

    def get(self, url: str, *, params: dict[str, Any] | None = None) -> requests.Response:
        def request() -> requests.Response:
            return self.session.get(
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

    def get_json(self, url: str, *, params: dict[str, Any] | None = None) -> Any:
        return self.get(url, params=params).json()

    def get_text(self, url: str, *, params: dict[str, Any] | None = None) -> str:
        return self.get(url, params=params).text
