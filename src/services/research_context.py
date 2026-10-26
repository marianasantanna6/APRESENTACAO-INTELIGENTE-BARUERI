'''Prepara os slides'''

from urllib.parse import urldefrag, urlsplit, urlunsplit

from models.research_data import ResearchData, RetrievedResearch
from utils.intent import detect_intent


def _canonical_url(url: str) -> str:
    without_fragment = urldefrag(url).url
    parts = urlsplit(without_fragment)
    return urlunsplit((parts.scheme.casefold(), parts.netloc.casefold(), parts.path.rstrip("/"), parts.query, ""))


def merge_research_context(
    topic: str,
    live: ResearchData | None,
    memories: list[RetrievedResearch],
) -> tuple[ResearchData | None, int]:
    """Combine current pages and retrieved memory sources, deduplicating URLs and identical extracts."""
    sources = list(live.fontes) if live else []
    known_urls = {_canonical_url(source.url) for source in sources}
    known_extracts = {" ".join(source.extract.casefold().split()) for source in sources}
    added_memory_sources = 0

    for memory in memories:
        for source in memory.sources:
            url_key = _canonical_url(source.url)
            extract_key = " ".join(source.extract.casefold().split())
            if url_key in known_urls or extract_key in known_extracts:
                continue
            sources.append(source)
            known_urls.add(url_key)
            known_extracts.add(extract_key)
            added_memory_sources += 1
            if len(sources) >= 12:
                break
        if len(sources) >= 12:
            break

    if not sources:
        return None, 0
    summary = "\n\n".join(f"[{source.id}] {source.title}: {source.extract}" for source in sources)
    context = ResearchData(
        title=live.title if live else memories[0].canonical_title,
        resumo_wiki=summary,
        keywords=live.keywords if live else list(dict.fromkeys(
            keyword for memory in memories for keyword in memory.keywords
        )),
        detectar_intencao=detect_intent(topic),
        fontes=sources,
        query=topic,
    )
    return context, added_memory_sources
