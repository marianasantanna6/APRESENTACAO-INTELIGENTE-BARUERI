'''É o supas né'''

from __future__ import annotations

from google import genai
from google.genai import types

import hashlib
import json
from dataclasses import dataclass
from typing import Any

import psycopg

from config.settings import (
    EMBEDDING_DIMENSIONS,
    EMBEDDING_MODEL,
    GEMINI_API_KEY,
    GEMINI_MAX_ATTEMPTS,
    GEMINI_MAX_RETRY_DELAY_SECONDS,
    GEMINI_TIMEOUT_MS,
    RESEARCH_VECTOR_DIMENSIONS,
    SUPABASE_DB_URL,
)
from models.research_data import ResearchData, ResearchSource, RetrievedResearch


@dataclass(frozen=True)
class StoredResearch:
    id: str
    embedding_status: str


def _connection() -> psycopg.Connection:
    if not SUPABASE_DB_URL:
        raise RuntimeError("SUPABASE_DB_URL não configurada. Adicione a URI PostgreSQL do Supabase ao .env.")
    if not SUPABASE_DB_URL.startswith(("postgresql://", "postgres://")):
        raise RuntimeError(
            "SUPABASE_DB_URL inválida: use a Connection string PostgreSQL do Supabase "
            "(postgresql://...), não a URL https:// do projeto."
        )
    return psycopg.connect(SUPABASE_DB_URL, autocommit=True)


def _embedding_input(query: str, research: ResearchData) -> str:
    """Texto estável que será transformado em vetor e usado em busca futura."""
    return "\n".join((
        f"Pergunta original: {query}",
        f"Título encontrado: {research.title}",
        f"Intenção: {research.detectar_intencao}",
        f"Palavras-chave: {', '.join(research.keywords)}",
        f"Conteúdo coletado: {research.resumo_wiki}",
    ))


def _create_embedding(text: str) -> list[float]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY não configurada.")

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=GEMINI_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(
                attempts=GEMINI_MAX_ATTEMPTS,
                initial_delay=1.0,
                max_delay=GEMINI_MAX_RETRY_DELAY_SECONDS,
                exp_base=2.0,
                jitter=1.0,
                http_status_codes=[408, 429, 500, 502, 503, 504],
            ),
        ),
    )
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIMENSIONS
        ),
    )

    return list(response.embeddings[0].values)


def _vector_literal(values: list[float] | None) -> str | None:
    if values is None:
        return None
    if EMBEDDING_DIMENSIONS != RESEARCH_VECTOR_DIMENSIONS:
        raise ValueError(
            f"EMBEDDING_DIMENSIONS={EMBEDDING_DIMENSIONS} não corresponde à coluna vector({RESEARCH_VECTOR_DIMENSIONS})."
        )
    if len(values) != RESEARCH_VECTOR_DIMENSIONS:
        raise ValueError(
            f"O embedding retornado tem {len(values)} dimensões; esperado: {RESEARCH_VECTOR_DIMENSIONS}."
        )
    return "[" + ",".join(str(value) for value in values) + "]"


def store_research(query: str, research: ResearchData, source_url: str | None = None) -> StoredResearch:
    """Persiste a coleta e seus metadados no Supabase e tenta gerar seu embedding para busca vetorial futura. Se a vetorização falhar, grava a pesquisa como pendente para processamento posterior."""
    embedding_input = _embedding_input(query, research)
    content_hash = hashlib.sha256(embedding_input.encode("utf-8")).hexdigest()
    existing = None
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, embedding_status, sources, embedding_model
            FROM public.research_memories
            WHERE content_hash = %s
            ORDER BY collected_at DESC
            LIMIT 1;
            """,
            (content_hash,),
        )
        existing = cursor.fetchone()
    if existing and existing[1] == "ready" and existing[3] == EMBEDDING_MODEL:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE public.research_memories
                SET source_url = %s, keywords = %s, intent = %s, sources = %s::jsonb
                WHERE id = %s;
                """,
                (
                    source_url,
                    research.keywords,
                    research.detectar_intencao,
                    json.dumps([source.to_dict() for source in research.fontes], ensure_ascii=False),
                    existing[0],
                ),
            )
        return StoredResearch(id=str(existing[0]), embedding_status="ready")

    try:
        vector = _vector_literal(_create_embedding(embedding_input))
        status = "ready" if vector else "pending"
    except Exception as exc:
        print(f"[AVISO] Não foi possível gerar embedding agora ({type(exc).__name__}).")
        vector, status = None, "pending"

    params: dict[str, Any] = {
        "query": query, "title": research.title, "content": research.resumo_wiki,
        "source_url": source_url, "keywords": research.keywords, "intent": research.detectar_intencao,
        "embedding_input": embedding_input, "content_hash": content_hash, "embedding": vector,
        "embedding_model": EMBEDDING_MODEL if vector else None, "embedding_status": status,
        "sources": json.dumps(
            [source.to_dict() for source in research.fontes], ensure_ascii=False
        ),
    }
    if existing:
        sql = """
            UPDATE public.research_memories
            SET source_url = %(source_url)s,
                keywords = %(keywords)s,
                intent = %(intent)s,
                embedding = %(embedding)s::extensions.vector,
                embedding_model = %(embedding_model)s,
                embedding_status = %(embedding_status)s,
                sources = %(sources)s::jsonb
            WHERE id = %(id)s
            RETURNING id, embedding_status;
        """
        params["id"] = existing[0]
    else:
        sql = """
        INSERT INTO public.research_memories (
            query, canonical_title, content, source, source_url, keywords, intent,
            embedding_input, content_hash, embedding, embedding_model, embedding_status, sources
        ) VALUES (
            %(query)s, %(title)s, %(content)s, 'wikipedia', %(source_url)s, %(keywords)s, %(intent)s,
            %(embedding_input)s, %(content_hash)s, %(embedding)s::extensions.vector,
            %(embedding_model)s, %(embedding_status)s, %(sources)s::jsonb
        ) RETURNING id, embedding_status;
        """
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
    if row is None:
        raise RuntimeError("O Supabase não retornou a pesquisa recém-gravada.")
    return StoredResearch(id=str(row[0]), embedding_status=row[1])


def _research_source(item: object, index: int, memory_id: str) -> ResearchSource | None:
    """Convert a JSON source row to a source ID unique to this retrieved memory."""
    if not isinstance(item, dict):
        return None
    title = item.get("titulo") or item.get("title")
    url = item.get("url")
    extract = item.get("trecho") or item.get("extract")
    original_id = item.get("id") or f"fonte_{index:02d}"
    if not all(isinstance(value, str) and value.strip() for value in (title, url, extract)):
        return None
    consulted_at = item.get("consultado_em") or item.get("consulted_at")
    metadata = item.get("metadados") or item.get("metadata") or {}
    if not isinstance(consulted_at, str):
        consulted_at = None
    if not isinstance(metadata, dict):
        metadata = {}
    return ResearchSource(
        id=f"mem_{memory_id[:8]}_{original_id}",
        title=title.strip(),
        url=url.strip(),
        extract=extract.strip(),
        consulted_at=consulted_at,
        metadata=metadata,
    )


def search_research_memories(
    query: str,
    *,
    match_count: int = 5,
    source_filter: str | None = None,
    intent_filter: str | None = None,
    minimum_similarity: float = 0.25,
) -> list[RetrievedResearch]:
    """Embed the user query and retrieve source-aware, model-compatible memories by cosine similarity."""
    query = query.strip() if isinstance(query, str) else ""
    if not query:
        raise ValueError("A consulta para busca vetorial não pode ficar vazia.")
    if not 0 <= minimum_similarity <= 1:
        raise ValueError("minimum_similarity precisa estar entre 0 e 1.")
    if EMBEDDING_DIMENSIONS != RESEARCH_VECTOR_DIMENSIONS:
        raise ValueError(
            f"EMBEDDING_DIMENSIONS={EMBEDDING_DIMENSIONS} não corresponde à coluna vector({RESEARCH_VECTOR_DIMENSIONS})."
        )

    query_vector = _vector_literal(_create_embedding(query))
    sql = """
        SELECT id, query, canonical_title, content, source, source_url, keywords,
               intent, collected_at, similarity, sources
        FROM public.search_research_memories(
            %(query_embedding)s::extensions.vector,
            %(embedding_model)s,
            %(match_count)s,
            %(source_filter)s,
            %(intent_filter)s,
            %(minimum_similarity)s
        );
    """
    params = {
        "query_embedding": query_vector,
        "embedding_model": EMBEDDING_MODEL,
        "match_count": min(max(int(match_count), 1), 50),
        "source_filter": source_filter,
        "intent_filter": intent_filter,
        "minimum_similarity": minimum_similarity,
    }
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()

    results: list[RetrievedResearch] = []
    for row in rows:
        memory_id = str(row[0])
        raw_sources = row[10]
        if isinstance(raw_sources, str):
            raw_sources = json.loads(raw_sources)
        sources = [
            source
            for index, item in enumerate(raw_sources or [], start=1)
            if (source := _research_source(item, index, memory_id)) is not None
        ]
        if not sources:
            continue
        results.append(RetrievedResearch(
            id=memory_id,
            query=row[1],
            canonical_title=row[2],
            content=row[3],
            source=row[4],
            source_url=row[5],
            keywords=list(row[6] or []),
            intent=row[7],
            collected_at=row[8].isoformat() if hasattr(row[8], "isoformat") else str(row[8]),
            similarity=float(row[9]),
            sources=sources,
        ))
    return results


def verify_connection() -> dict[str, Any]:
    """Confirma acesso de leitura ao banco e retorna contagens de pesquisas, embeddings prontos e pendentes. Não chama serviços de IA nem altera registros."""
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("""
            SELECT count(*)::int, count(*) FILTER (WHERE embedding IS NOT NULL)::int,
                   count(*) FILTER (WHERE embedding_status = 'pending')::int
            FROM public.research_memories;
        """)
        total, with_embedding, pending = cursor.fetchone()
    return {"total": total, "with_embedding": with_embedding, "pending": pending}


def backfill_pending_embeddings(limit: int = 100) -> int:
    """Gera embeddings para até `limit` pesquisas pendentes e marca os registros como prontos. Requer chave Gemini e retorna quantos registros foram atualizados."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY não configurada; não é possível gerar embeddings pendentes.")

    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, embedding_input FROM public.research_memories
            WHERE embedding_status = 'pending'
            ORDER BY collected_at ASC
            LIMIT %s;
            """,
            (limit,),
        )
        pending_rows = cursor.fetchall()

        updated = 0
        for row_id, text in pending_rows:
            vector = _vector_literal(_create_embedding(text))
            cursor.execute(
                """
                UPDATE public.research_memories
                SET embedding = %s::extensions.vector, embedding_model = %s, embedding_status = 'ready'
                WHERE id = %s;
                """,
                (vector, EMBEDDING_MODEL, row_id),
            )
            updated += 1
    return updated
