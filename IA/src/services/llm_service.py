from langchain_google_genai import ChatGoogleGenerativeAI

from config.settings import DEFAULT_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_TIMEOUT_MS


def build_llm(model: str = DEFAULT_GEMINI_MODEL) -> ChatGoogleGenerativeAI:
    """Cria o cliente de chat Gemini sem forçar valores de amostragem incompatíveis com o modelo."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY não configurada. Verifique o arquivo .env.")

    return ChatGoogleGenerativeAI(
        model=model,
        api_key=GEMINI_API_KEY,
        timeout=GEMINI_TIMEOUT_MS / 1000,
        # A decisão de retry fica na camada de pesquisa para controlar alternância de modelo e backoff.
        max_retries=1,
    )
