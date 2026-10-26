from langchain_google_genai import ChatGoogleGenerativeAI

from config.settings import DEFAULT_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_TIMEOUT_MS


def build_llm(model: str = DEFAULT_GEMINI_MODEL) -> ChatGoogleGenerativeAI:
    """Cria o cliente de chat Gemini com temperatura zero para respostas mais consistentes. Exige `GEMINI_API_KEY` e permite selecionar o modelo chamado pelo fluxo."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY não configurada. Verifique o arquivo .env.")

    return ChatGoogleGenerativeAI(
        model=model,
        temperature=0,
        api_key=GEMINI_API_KEY,
        timeout=GEMINI_TIMEOUT_MS / 1000,
        # Uma tentativa aqui; o fluxo de pesquisa possui a política de retry limitada.
        max_retries=1,
    )
