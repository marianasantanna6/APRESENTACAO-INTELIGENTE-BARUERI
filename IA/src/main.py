import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from langchain_core.exceptions import OutputParserException
from langchain_google_genai.chat_models import GoogleGenerativeAIError

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from chains.research_chain import build_research_chain
from config.settings import DEFAULT_GEMINI_MODEL, GEMINI_FALLBACK_MODELS, OUTPUT_DIR
from services.claim_service import build_claim_evidence
from services.presentation_service import validate_presentation
from services.pptx_generator import criar_apresentacao
from services.research_context import merge_research_context
from services.sources.registry import collect_current_sources
from services.supabase_service import search_research_memories, store_research
from models.research_data import ClaimEvidence, PresentationResult, ResearchData, ResearchSource
from utils.intent import detect_intent
from utils.keywords import extract_keywords
from utils.retries import call_with_retry, retry_after_seconds


class ResearchGenerationError(RuntimeError):
    """Erro de pesquisa que inclui estados dos conectores e afirmações rejeitadas."""

    def __init__(
        self,
        message: str,
        source_status: list[dict[str, Any]],
        claims: list[ClaimEvidence] | None = None,
    ) -> None:
        self.source_status = source_status
        self.claims = claims or []
        super().__init__(message)


class ResearchModelRateLimitError(RuntimeError):
    """O provedor recusou a geração por limite de requisições/quota."""


def _output_path(title: str, presentation_id: str | None = None) -> Path:
    slug = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", slug).strip("_").lower() or "apresentacao"
    if presentation_id:
        safe_id = str(UUID(presentation_id))
        return OUTPUT_DIR / f"{safe_id}.pptx"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return OUTPUT_DIR / f"{slug}_{timestamp}.pptx"


def _exception_chain(exc: Exception):
    current = exc
    visited = set()
    while current is not None and id(current) not in visited:
        visited.add(id(current))
        yield current
        current = current.__cause__ or current.__context__


def _gemini_status(exc: Exception) -> int | None:
    for item in _exception_chain(exc):
        code = getattr(item, "code", None) or getattr(item, "status_code", None)
        if isinstance(code, int):
            return code
        response = getattr(item, "response", None)
        code = getattr(response, "status_code", None) or getattr(response, "status", None)
        if isinstance(code, int):
            return code
    return None


def _gemini_quota_exhausted(exc: Exception) -> bool:
    for item in _exception_chain(exc):
        message = str(item).casefold()
        if any(
            marker in message
            for marker in ("resource_exhausted", "quota exceeded", "quotaexceeded")
        ):
            return True
        if "rate limit" in type(item).__name__.casefold():
            return True
    return False


def _transient_gemini_error(exc: Exception) -> bool:
    if _gemini_quota_exhausted(exc):
        return False
    status = _gemini_status(exc)
    if status is not None:
        return status in {408, 500, 502, 503, 504}
    if isinstance(exc, (TimeoutError, ConnectionError)):
        return True
    return any(
        type(item).__name__ in {
            "TimeoutException", "ConnectError", "ConnectTimeout", "ReadTimeout",
            "WriteTimeout", "RemoteProtocolError",
        }
        for item in _exception_chain(exc)
    )


def _gemini_retry_after(exc: Exception) -> float | None:
    for item in _exception_chain(exc):
        response = getattr(item, "response", None)
        headers = getattr(response, "headers", None)
        if headers:
            return retry_after_seconds(headers.get("Retry-After"))
    return None


def _repair_feedback(error: ValueError) -> str:
    return (
        f"Erro de validação: {error}\n"
        "Corrija o objeto JSON completo para cumprir o contrato e todos os limites visuais por layout. "
        "Fontes e citações são opcionais; nunca invente IDs ou apresente conteúdo não verificado como dado oficial."
    )


def generate_research(
    tema: str,
    ia_prompt: str | None = None,
    presentation_id: str | None = None,
    *,
    request_context: dict | None = None,
    project_source: str | None = None,
) -> PresentationResult | None:
    """Searches current and vector-retrieved sources, builds slides, and returns structured data with its PPTX."""
    tema = tema.strip() if isinstance(tema, str) else ""
    if not tema:
        raise ValueError("O tema de pesquisa não pode ficar vazio.")
    if len(tema) > 300:
        raise ValueError("O tema de pesquisa pode ter no máximo 300 caracteres.")

    rag_status = "unavailable"
    memories = []
    try:
        memories = search_research_memories(tema, match_count=3)
        rag_status = "no_results" if not memories else "retrieved"
    except Exception as exc:
        print(f"[RAG INDISPONÍVEL] A recuperação vetorial falhou ({type(exc).__name__}); a pesquisa seguirá com as fontes atuais.")

    current_sources, source_status = collect_current_sources(tema)
    live_context = ResearchData(
        title=current_sources[0].title if current_sources else tema,
        resumo_wiki="\n\n".join(
            f"[{source.id}] {source.title}: {source.extract}"
            for source in current_sources
        ),
        keywords=extract_keywords(tema),
        fontes=current_sources,
        query=tema,
        source_status=source_status,
    )
    contexto, retrieved_source_count = merge_research_context(tema, live_context, memories)
    if project_source:
        if contexto is None:
            contexto = ResearchData(
                title=tema,
                resumo_wiki="",
                query=tema,
                source_status=source_status,
            )
        project_reference = ResearchSource(
            id="dados_projeto_01",
            title="Dados do projeto fornecidos pelo backend (não verificados externamente)",
            url="",
            extract=project_source,
            source_name="DTO do projeto",
            identifier="dados_projeto_01",
            metadata={"origem": "payload_backend", "verificado_externamente": False},
        )
        contexto.fontes.append(project_reference)
        contexto.resumo_wiki = "\n\n".join(
            part for part in (contexto.resumo_wiki, project_source) if part
        )
    if contexto is None:
        contexto = ResearchData(
            title=tema,
            resumo_wiki="",
            keywords=extract_keywords(tema),
            detectar_intencao=detect_intent(tema),
            query=tema,
            source_status=source_status,
        )
    contexto.request_context = request_context or {}

    if live_context.fontes:
        live_context.detectar_intencao = detect_intent(tema)
        try:
            saved = store_research(
                tema,
                live_context,
                source_url=live_context.fontes[0].url if live_context.fontes else None,
            )
            print(f"[BANCO] Coleta salva (id: {saved.id}, embedding: {saved.embedding_status}).")
        except Exception as exc:
            print(f"[AVISO] A coleta não foi salva no Supabase ({type(exc).__name__}).")

    if retrieved_source_count:
        rag_status = "used"
    elif memories and rag_status == "retrieved":
        rag_status = "no_new_sources"
    print(f"[RAG] status={rag_status}; novas fontes recuperadas={retrieved_source_count}.")

    modelos = list(dict.fromkeys([DEFAULT_GEMINI_MODEL, *GEMINI_FALLBACK_MODELS]))
    ultimo_erro = None
    contexto_ia = contexto.to_chain_input()

    for modelo in modelos:
        try:
            chain = build_research_chain(modelo)
        except (FileNotFoundError, RuntimeError, ValueError) as exc:
            ultimo_erro = exc
            print(f"[ERRO] Não foi possível preparar a geração da apresentação: {exc}")
            return None

        entradas = {
            **contexto_ia,
            "ia_prompt": ia_prompt or "",
            "resposta_anterior": "",
            "feedback_validacao": "",
        }
        apresentacao = None
        claims = []
        for tentativa in range(2):
            try:
                resposta = call_with_retry(
                    lambda: chain.invoke(entradas),
                    retryable_exception=_transient_gemini_error,
                    retryable_result=lambda _: False,
                    retry_after_exception=_gemini_retry_after,
                    attempts=3,
                    initial_delay=0.5,
                    max_delay=8.0,
                )
            except OutputParserException as exc:
                ultimo_erro = exc
                if tentativa == 0:
                    entradas["feedback_validacao"] = f"A resposta não é um JSON válido: {exc}"
                    print(f"[AVISO] O modelo {modelo} retornou JSON inválido; tentando corrigir a resposta.")
                    continue
                print(f"[AVISO] O modelo {modelo} continuou retornando JSON inválido: {exc}")
                break
            except Exception as exc:
                if not isinstance(exc, GoogleGenerativeAIError) and _gemini_status(exc) is None:
                    raise
                ultimo_erro = exc
                print(f"[AVISO] O modelo {modelo} falhou ao gerar a resposta ({type(exc).__name__}).")
                if _gemini_status(exc) == 429:
                    break
                if not _transient_gemini_error(exc):
                    print("[ERRO] Falha permanente do provedor/modelo; não serão feitas novas chamadas de modelo.")
                    return None
                break

            try:
                candidate = validate_presentation(resposta, contexto.fontes, tema)
                claims = build_claim_evidence(candidate, contexto.fontes)
                apresentacao = candidate
            except ValueError as exc:
                ultimo_erro = exc
                if tentativa == 0:
                    entradas["resposta_anterior"] = json.dumps(resposta, ensure_ascii=False)
                    entradas["feedback_validacao"] = _repair_feedback(exc)
                    print(f"[AVISO] O modelo {modelo} retornou conteúdo inválido; tentando corrigir: {exc}")
                    continue
                print(f"[AVISO] O modelo {modelo} continuou retornando conteúdo inválido: {exc}")
                break
            break

        if apresentacao is None:
            continue

        if rag_status == "unavailable":
            if contexto.fontes:
                apresentacao["limitacoes"].append(
                    "A recuperação RAG não ficou disponível; a apresentação usou somente as fontes atuais da pesquisa."
                )
            else:
                apresentacao["limitacoes"].append(
                    "A recuperação RAG não ficou disponível e nenhuma fonte externa foi encontrada."
                )
        elif rag_status in {"no_results", "no_new_sources"}:
            apresentacao["limitacoes"].append(
                "A busca RAG não encontrou fontes anteriores adicionais com relevância e referências verificáveis."
            )

        failed_sources = [
            str(status["fonte"])
            for status in source_status
            if status.get("status") == "failed" and status.get("fonte")
        ]
        if failed_sources:
            apresentacao["limitacoes"].append(
                "Não foi possível consultar estas fontes durante a pesquisa: "
                f"{', '.join(failed_sources)}."
            )

        try:
            caminho = criar_apresentacao(
                apresentacao,
                _output_path(apresentacao["titulo"], presentation_id),
            )
        except (OSError, ValueError, KeyError, TypeError) as exc:
            print(f"[ERRO] A apresentação foi validada, mas não pôde ser renderizada ou salva: {exc}")
            return None
        for limitacao in apresentacao["limitacoes"]:
            print(f"[LIMITAÇÃO] {limitacao}")
        return PresentationResult(
            presentation=apresentacao,
            pptx_path=caminho,
            rag_status=rag_status,
            retrieved_count=len(memories),
            sources=contexto.fontes,
            claims=claims,
            source_status=source_status,
        )

    if ultimo_erro is not None and _gemini_status(ultimo_erro) == 429:
        raise ResearchModelRateLimitError(
            "O provedor de IA atingiu o limite de requisições. Tente novamente mais tarde "
            "ou configure outro modelo/provedor."
        ) from ultimo_erro
    print(f"[ERRO] Não foi possível gerar uma apresentação válida: {ultimo_erro}")
    return None


def run_research(tema: str) -> Path | None:
    """Compatibilidade com o ponto de entrada CLI: retorna apenas o caminho do PPTX."""
    result = generate_research(tema)
    return result.pptx_path if result else None