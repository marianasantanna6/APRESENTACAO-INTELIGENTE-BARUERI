from config.settings import STOPWORDS


def extract_keywords(tema: str) -> list[str]:
    palavras = tema.lower().split()
    return [p for p in palavras if p not in STOPWORDS]
