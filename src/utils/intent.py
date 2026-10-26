def detect_intent(tema: str) -> str:
    tema = tema.lower()

    if "o que" in tema or "que é" in tema:
        return "definicao"
    if "como" in tema:
        return "processo"
    if "por que" in tema:
        return "causa"
    if "onde" in tema:
        return "localizacao"
    if "quando" in tema:
        return "tempo"

    return "desconhecido"
