# tão importante quanto o .env (Não vazar)

import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

PPTX_STYLE_GUIDE_PATH = PROJECT_ROOT / "estiliza_o_e_configura_o_pptx.md"
ASSETS_DIR = PROJECT_ROOT / "assets"
OUTPUT_DIR = PROJECT_ROOT / "output"
PRESENTATION_CONTACT = {
    "nome": os.getenv("PRESENTATION_CONTACT_NAME", ""),
    "cargo": os.getenv("PRESENTATION_CONTACT_ROLE", ""),
    "telefone": os.getenv("PRESENTATION_CONTACT_PHONE", ""),
    "email": os.getenv("PRESENTATION_CONTACT_EMAIL", ""),
    "website": os.getenv("PRESENTATION_CONTACT_WEBSITE", ""),
}

STOPWORDS = [
    "o", "a", "os", "de", "do", "da", "é", "um", "uma", "que", "oque",
    "para", "em", "com", "por", "se", "não", "na", "no", "as", "dos",
    "das", "ao", "à", "às", "ou", "e",
]

WIKIPEDIA_SEARCH_URL = "https://pt.wikipedia.org/w/api.php"
WIKIPEDIA_SUMMARY_URL = "https://pt.wikipedia.org/api/rest_v1/page/summary"
IBGE_AGGREGATES_URL = "https://servicodados.ibge.gov.br/api/v3/agregados"
IBGE_LOCALITIES_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"
SEADE_CKAN_API_URL = os.getenv("SEADE_CKAN_API_URL") or "https://dadosabertos.sp.gov.br/api/3/action"
RIC_CPS_BASE_URL = os.getenv("RIC_CPS_BASE_URL") or "https://ric.cps.sp.gov.br"
OPENALEX_API_URL = os.getenv("OPENALEX_API_URL") or "https://api.openalex.org"
OPENALEX_API_KEY = os.getenv("OPENALEX_API_KEY")
OPENALEX_MAILTO = os.getenv("OPENALEX_MAILTO")
SCIELO_SEARCH_URL = os.getenv("SCIELO_SEARCH_URL") or "https://search.scielo.org/"
DEFAULT_REQUEST_HEADERS = {
    "User-Agent": "ApresentacaoInteligenteBarueri/1.1 (research integration; contact: administrator)"
}
DEFAULT_REQUEST_TIMEOUT = 20
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL") or "gemini-3.6-flash"
GEMINI_FALLBACK_MODELS = [
    model.strip()
    for model in os.getenv(
        "GEMINI_FALLBACK_MODELS", "gemini-3-flash-preview"
    ).split(",")
    if model.strip()
]
if not GEMINI_FALLBACK_MODELS:
    GEMINI_FALLBACK_MODELS = ["gemini-3-flash-preview"]
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# URI PostgreSQL obtida em Supabase > Settings > Database > Connection string.
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL") or "gemini-embedding-2"
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS") or "1536")

RESEARCH_VECTOR_DIMENSIONS = 1536
GEMINI_MAX_ATTEMPTS = 3
GEMINI_TIMEOUT_MS = 30_000
GEMINI_MAX_RETRY_DELAY_SECONDS = 8.0
WIKIPEDIA_MAX_ATTEMPTS = 3
WIKIPEDIA_MAX_RETRY_DELAY_SECONDS = 8.0
SOURCE_MAX_RESULTS_PER_ADAPTER = 3
SOURCE_MAX_WORKERS = 4
