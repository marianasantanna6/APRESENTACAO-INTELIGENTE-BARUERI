"""Pequenas rotinas compartilhadas pelos adaptadores de fontes."""

from __future__ import annotations

from datetime import datetime, timezone
import re
import unicodedata
from typing import Any


def accessed_at() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def compact_text(value: object, *, max_length: int = 1_800) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:max_length].rstrip()


def normalized_text(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", plain.lower()).strip()


def first_string(metadata: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, list):
            parts = [item.strip() for item in value if isinstance(item, str) and item.strip()]
            if parts:
                return "; ".join(parts)
    return None
