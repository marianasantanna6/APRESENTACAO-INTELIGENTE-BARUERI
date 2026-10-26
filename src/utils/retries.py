'''Codigo para ajudar a lidar com falhas transitórias de serviços HTTP externos.'''

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import random
import time
from typing import Callable, TypeVar

T = TypeVar("T")


def retry_after_seconds(value: str | None, *, now: datetime | None = None) -> float | None:
    '''Parse o cabeçalho HTTP Retry-After em segundos.'''
    if not value:
        return None
    try:
        return max(0.0, float(value.strip()))
    except ValueError:
        pass
    try:
        retry_at = parsedate_to_datetime(value)
        if retry_at.tzinfo is None:
            retry_at = retry_at.replace(tzinfo=timezone.utc)
        current = now or datetime.now(timezone.utc)
        return max(0.0, (retry_at - current).total_seconds())
    except (TypeError, ValueError, OverflowError):
        return None


def call_with_retry(
    operation: Callable[[], T],
    *,
    retryable_exception: Callable[[Exception], bool],
    retryable_result: Callable[[T], bool],
    retry_after: Callable[[T], float | None] | None = None,
    retry_after_exception: Callable[[Exception], float | None] | None = None,
    attempts: int = 3,
    initial_delay: float = 0.5,
    max_delay: float = 8.0,
    sleep: Callable[[float], None] = time.sleep,
    jitter: Callable[[float, float], float] = random.uniform,
) -> T:

    '''Realiza uma operação com retry limitado, exponencial apenas depois de alguns segundo, tendo um limite máximo de delay e jitter.'''
    if attempts < 1:
        raise ValueError("attempts precisa ser pelo menos 1.")
    if initial_delay < 0 or max_delay < 0:
        raise ValueError("Os intervalos de retry não podem ser negativos.")

    for attempt in range(1, attempts + 1):
        try:
            result = operation()
        except Exception as exc:
            if attempt == attempts or not retryable_exception(exc):
                raise
            requested_delay = retry_after_exception(exc) if retry_after_exception else None
            if requested_delay is not None and requested_delay > max_delay:
                raise
        else:
            if attempt == attempts or not retryable_result(result):
                return result
            requested_delay = retry_after(result) if retry_after else None
            if requested_delay is not None and requested_delay > max_delay:
                return result

        exponential = min(initial_delay * (2 ** (attempt - 1)), max_delay)
        if requested_delay is not None:
            delay = requested_delay
        else:
            delay = min(exponential + jitter(0.0, min(exponential, 1.0)), max_delay)
        sleep(delay)

    raise RuntimeError("Fluxo de retry terminou em estado inesperado.")
