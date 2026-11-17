from pathlib import Path
import sys
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from models.request import LegacyResearchRequest, ProjectGenerationRequest  # noqa: E402
from config.settings import OUTPUT_DIR  # noqa: E402
from main import ResearchGenerationError, ResearchModelRateLimitError, generate_research  # noqa: E402


app = FastAPI(
    title="Serviço de pesquisa e apresentações",
    version="1.0.0",
    description="Pesquisa fontes, recupera pesquisas anteriores e gera apresentações acadêmicas.",
)


class ResearchResponse(BaseModel):
    presentation_id: UUID
    presentation: dict[str, Any]
    download_url: str
    rag: dict[str, Any]
    source_status: list[dict[str, Any]]
    claims: list[dict[str, Any]]
    # Imagens dos slides do PPTX (na ordem) e PDF; vazios quando a conversão não está disponível.
    slide_images: list[str] = []
    pdf_url: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    '''Retorna o processo de liveness sem depender de serviços externos.'''
    return {"status": "ok"}


@app.post("/research", response_model=ResearchResponse)
def research(
    request: ProjectGenerationRequest | LegacyResearchRequest,
) -> ResearchResponse:
    """Gera JSON estruturado e disponibiliza o PPTX para download."""
    presentation_id = uuid4()
    request_context = request.to_prompt_context()
    project_source = (
        request.to_project_source_text()
        if isinstance(request, ProjectGenerationRequest)
        else None
    )
    try:
        result = generate_research(
            request.query,
            presentation_id=str(presentation_id),
            ia_prompt=(
                request.ia_prompt
                if isinstance(request, ProjectGenerationRequest)
                else None
            ),
            request_context=request_context,
            project_source=project_source,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ResearchGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": str(exc),
                "source_status": exc.source_status,
                "claims": [claim.to_dict() for claim in exc.claims],
            },
        ) from exc
    except ResearchModelRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except Exception as exc:
        print(f"[API] Falha não tratada durante pesquisa ({type(exc).__name__}).")
        raise HTTPException(status_code=502, detail="Não foi possível concluir a pesquisa.") from None

    if result is None:
        raise HTTPException(status_code=502, detail="Não foi possível gerar uma apresentação.")

    return ResearchResponse(
        presentation_id=presentation_id,
        presentation=result.presentation,
        download_url=f"/presentations/{presentation_id}",
        rag={"status": result.rag_status, "memories_retrieved": result.retrieved_count},
        source_status=result.source_status,
        claims=[claim.to_dict() for claim in result.claims],
        slide_images=[
            f"/presentations/{presentation_id}/slides/{number}"
            for number in range(1, len(result.slide_images) + 1)
        ],
        pdf_url=f"/presentations/{presentation_id}/pdf" if result.pdf_path else None,
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


@app.get("/presentations/{presentation_id}/slides/{number}")
def download_slide_image(presentation_id: UUID, number: int) -> FileResponse:
    '''Serve a imagem (WebP) do slide ``number`` (1 = capa) da apresentação.'''
    if number < 1 or number > 99:
        raise HTTPException(status_code=404, detail="Slide não encontrado.")
    path = OUTPUT_DIR / str(presentation_id) / f"slide_{number:02d}.webp"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Slide não encontrado.")
    return FileResponse(path, media_type="image/webp")


@app.get("/presentations/{presentation_id}/pdf")
def download_presentation_pdf(presentation_id: UUID) -> FileResponse:
    '''Serve o PDF da apresentação, gerado a partir do mesmo PPTX.'''
    path = OUTPUT_DIR / str(presentation_id) / "apresentacao.pdf"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="PDF não encontrado.")
    return FileResponse(path, media_type="application/pdf", filename=f"apresentacao_{presentation_id}.pdf")
