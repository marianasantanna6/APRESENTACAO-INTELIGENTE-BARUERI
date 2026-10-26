from langchain_core.output_parsers import JsonOutputParser

from prompts.academic_prompt import build_prompt_template
from services.llm_service import build_llm


def build_research_chain(model: str | None = None):
    """Monta a cadeia que combina prompt acadêmico, modelo Gemini e parser JSON. O modelo opcional permite ao fluxo alternar para configurações de fallback."""
    prompt = build_prompt_template()
    llm = build_llm(model) if model else build_llm()
    return prompt | llm | JsonOutputParser()
