

from pathlib import Path
import sys
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from config.settings import OUTPUT_DIR  # noqa: E402
from main import generate_research  # noqa: E402


app = FastAPI(
    title="Serviço de pesquisa e apresentações",
    version="1.0.0",
    description="Pesquisa fontes, recupera pesquisas anteriores e gera apresentações acadêmicas.",
)


class ResearchRequest(BaseModel):
    tema: str = Field(min_length=1, max_length=300, description="Pergunta ou tema enviado pelo usuário.")


class ResearchResponse(BaseModel):
    presentation_id: UUID
    presentation: dict[str, Any]
    download_url: str
    rag: dict[str, Any]


@app.get("/health")
def health() -> dict[str, str]:
    '''Retorna o processo de liveness sem depender de serviços externos.'''
    return {"status": "ok"}


@app.post("/research", response_model=ResearchResponse)
def research(request: ResearchRequest) -> ResearchResponse:
    '''Roda o python e retorna a estrutura de slides mais a URL do PPTX.'''
    presentation_id = uuid4()
    try:
        result = generate_research(request.tema, str(presentation_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        print(f"[API] Falha não tratada durante pesquisa ({type(exc).__name__}).")
        raise HTTPException(status_code=502, detail="Não foi possível concluir a pesquisa.") from None

    if result is None:
        raise HTTPException(status_code=502, detail="Não foi possível gerar uma apresentação com fontes verificáveis.")

    return ResearchResponse(
        presentation_id=presentation_id,
        presentation=result.presentation,
        download_url=f"/presentations/{presentation_id}",
        rag={"status": result.rag_status, "memories_retrieved": result.retrieved_count},
    )


@app.get("/presentations/{presentation_id}")
def download_presentation(presentation_id: UUID) -> FileResponse:
    '''Serve o arquivo PPTX correspondente ao ID da apresentação.'''
    path = OUTPUT_DIR / f"{presentation_id}.pptx"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Apresentação não encontrada.")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=f"apresentacao_{presentation_id}.pptx",
    )
