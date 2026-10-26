import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from uuid import UUID

from langchain_core.exceptions import OutputParserException
from langchain_google_genai.chat_models import GoogleGenerativeAIError

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from chains.research_chain import build_research_chain
from config.settings import DEFAULT_GEMINI_MODEL, GEMINI_FALLBACK_MODELS, OUTPUT_DIR
from services.presentation_service import validate_presentation
from services.pptx_generator import criar_apresentacao
from services.research_context import merge_research_context
from services.supabase_service import search_research_memories, store_research
from models.research_data import PresentationResult
from services.wiki_service import fetch_wikipedia_context
from utils.intent import detect_intent
from utils.retries import call_with_retry, retry_after_seconds


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


def _transient_gemini_error(exc: Exception) -> bool:
    status = _gemini_status(exc)
    if status is not None:
        return status in {408, 429, 500, 502, 503, 504}
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
    message = str(error)
    quote_error = re.search(
        r"A citação do slide (\d+) excede (\d+) caracteres", message, re.IGNORECASE
    )
    if quote_error:
        slide_number, limit = quote_error.groups()
        return (
            f"Erro de validação: {message}\n"
            f"Corrija o slide {slide_number}: use em 'citacao.texto' um trecho literal e contíguo, "
            f"copiado de uma fonte citada nesse slide, com no máximo {limit} caracteres. "
            "Não resuma nem parafraseie. Se nenhuma fonte citada tiver um trecho adequado nesse limite, "
            "troque o layout para um que não seja 'destaque_citacao' e defina 'citacao' como null. "
            "Preserve as afirmações factuais apenas se continuarem sustentadas pelas fontes."
        )

    source_error = re.search(
        r"O slide (\d+) \(([^)]+)\) precisa citar pelo menos uma fonte válida", message
    )
    if source_error:
        slide_number, layout = source_error.groups()
        return (
            f"Erro de validação: {message}\n"
            f"Corrija o slide {slide_number} ({layout}): preencha 'fontes' com pelo menos um ID existente "
            "na lista de fontes fornecidas e que sustente o conteúdo/título do slide. Isso também vale para "
            "divisores de seção. Não invente IDs. Se nenhum dado puder ser sustentado, remova o slide ou "
            "reformule-o usando somente conteúdo apoiado pelas fontes; não deixe fontes vazias."
        )

    if "só pode ser preenchido no layout 'destaque_citacao'" in message:
        return (
            f"Erro de validação: {message}\n"
            "Use 'citacao' somente no layout 'destaque_citacao'. Nos demais layouts, defina 'citacao' como null."
        )

    return (
        f"Erro de validação: {message}\n"
        "Corrija o objeto JSON completo para cumprir o contrato e todos os limites visuais por layout. "
        "Preserve somente afirmações sustentadas pelas fontes fornecidas, use IDs existentes e não invente dados."
    )


def generate_research(tema: str, presentation_id: str | None = None) -> PresentationResult | None:
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

    live_context = fetch_wikipedia_context(tema)
    contexto, retrieved_source_count = merge_research_context(tema, live_context, memories)
    if not contexto:
        print("Não foi possível obter fontes atuais nem memórias RAG com referências verificáveis.")
        return None

    if live_context:
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
            "resposta_anterior": "",
            "feedback_validacao": "",
        }
        apresentacao = None
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
            except GoogleGenerativeAIError as exc:
                ultimo_erro = exc
                print(f"[AVISO] O modelo {modelo} falhou ao gerar a resposta ({type(exc).__name__}).")
                if not _transient_gemini_error(exc):
                    print("[ERRO] Falha permanente do provedor/modelo; não serão feitas novas chamadas de modelo.")
                    return None
                break

            try:
                apresentacao = validate_presentation(resposta, contexto.fontes, tema)
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
            apresentacao["limitacoes"].append(
                "A recuperação RAG não ficou disponível; a apresentação usou somente as fontes atuais da pesquisa."
            )
        elif rag_status in {"no_results", "no_new_sources"}:
            apresentacao["limitacoes"].append(
                "A busca RAG não encontrou fontes anteriores adicionais com relevância e referências verificáveis."
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
        )

    print(f"[ERRO] Não foi possível gerar uma apresentação válida: {ultimo_erro}")
    return None


def run_research(tema: str) -> Path | None:
    """Compatibilidade com o ponto de entrada CLI: retorna apenas o caminho do PPTX."""
    result = generate_research(tema)
    return result.pptx_path if result else None


def main() -> bool:
    """Solicita um tema no terminal e dispara o fluxo de pesquisa; o valor retornado controla se o menu deve repetir."""
    tema = input("O que você quer pesquisar? ").strip()
    if not tema:
        print("Nenhum tema informado.")
        return True

    caminho = run_research(tema)
    if caminho:
        print(f"\nApresentação gerada: {caminho}")

    resposta = input("\nDeseja fazer outra pesquisa? (s/n): ").strip().lower()
    return resposta != "n"


if __name__ == "__main__":
    while main():
        pass
