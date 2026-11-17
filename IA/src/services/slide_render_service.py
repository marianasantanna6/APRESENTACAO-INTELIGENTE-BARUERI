'''Converte o PPTX gerado em PDF e em imagens (uma por slide) para exibição na interface.

A conversão usa o LibreOffice em modo headless (PPTX → PDF) e o pypdfium2 (PDF → imagens).
As imagens são exatamente os slides do arquivo exportado, então o modo apresentador da
interface mostra o mesmo conteúdo que o usuário baixa.

Se o LibreOffice não estiver instalado ou a conversão falhar, a geração da apresentação
continua normalmente: o resultado informa o erro e a interface usa a visualização anterior.
'''

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image
from pptx import Presentation

SLIDE_IMAGE_WIDTH_PX = 1920
SLIDE_IMAGE_QUALITY = 90
CONVERSION_TIMEOUT_SECONDS = 180

_SOFFICE_CANDIDATES = [
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/lib/libreoffice/program/soffice",
    "/opt/libreoffice/program/soffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
]


@dataclass
class SlideRenderResult:
    pdf_path: Path | None = None
    images: list[Path] = field(default_factory=list)
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None and bool(self.images)


def find_soffice() -> str | None:
    '''Localiza o executável do LibreOffice (``LIBREOFFICE_PATH`` tem prioridade).'''
    configured = os.getenv("LIBREOFFICE_PATH")
    candidates = [configured, shutil.which("soffice"), shutil.which("libreoffice"), *_SOFFICE_CANDIDATES]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    return None


def _convert_to_pdf(soffice: str, pptx_path: Path, workdir: Path) -> Path:
    # Perfil de usuário isolado: permite conversões simultâneas e não depende do perfil do servidor.
    profile = (workdir / "perfil_libreoffice").resolve()
    command = [
        soffice,
        f"-env:UserInstallation={profile.as_uri()}",
        "--headless", "--invisible", "--nologo", "--norestore", "--nodefault", "--nolockcheck",
        "--convert-to", "pdf",
        "--outdir", str(workdir),
        str(pptx_path),
    ]
    completed = subprocess.run(
        command, capture_output=True, timeout=CONVERSION_TIMEOUT_SECONDS, check=False,
    )
    pdf = workdir / f"{pptx_path.stem}.pdf"
    if not pdf.is_file():
        details = (completed.stderr or completed.stdout or b"").decode("utf-8", "ignore").strip()
        raise RuntimeError(f"o LibreOffice não gerou o PDF (código {completed.returncode}). {details[:300]}")
    return pdf


def _pdf_to_images(pdf_path: Path, output_dir: Path) -> list[Path]:
    import pypdfium2 as pdfium  # importado só aqui: dependência opcional do fluxo principal

    images: list[Path] = []
    document = pdfium.PdfDocument(str(pdf_path))
    try:
        for index in range(len(document)):
            page = document[index]
            scale = SLIDE_IMAGE_WIDTH_PX / page.get_width()
            bitmap = page.render(scale=scale)
            image: Image.Image = bitmap.to_pil().convert("RGB")
            target = output_dir / f"slide_{index + 1:02d}.webp"
            image.save(target, "WEBP", quality=SLIDE_IMAGE_QUALITY, method=6)
            images.append(target)
            page.close()
    finally:
        document.close()
    return images


def render_presentation_images(pptx_path: str | Path, output_dir: str | Path) -> SlideRenderResult:
    '''Gera ``apresentacao.pdf`` e ``slide_NN.webp`` em ``output_dir`` a partir do PPTX.'''
    pptx_path = Path(pptx_path).resolve()
    output_dir = Path(output_dir)
    soffice = find_soffice()
    if soffice is None:
        return SlideRenderResult(error=(
            "LibreOffice não encontrado no servidor (instale-o ou defina LIBREOFFICE_PATH)"
        ))
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    try:
        with tempfile.TemporaryDirectory(prefix="render_slides_") as tmp:
            pdf_tmp = _convert_to_pdf(soffice, pptx_path, Path(tmp))
            pdf_path = output_dir / "apresentacao.pdf"
            shutil.move(str(pdf_tmp), pdf_path)
        images = _pdf_to_images(pdf_path, output_dir)
    except subprocess.TimeoutExpired:
        return SlideRenderResult(error=f"a conversão excedeu {CONVERSION_TIMEOUT_SECONDS} s")
    except Exception as exc:  # conversão é complementar: nunca derruba a geração
        return SlideRenderResult(error=f"{type(exc).__name__}: {exc}")

    expected = len(Presentation(str(pptx_path)).slides)
    if len(images) != expected:
        return SlideRenderResult(
            pdf_path=pdf_path, images=images,
            error=f"o PDF tem {len(images)} páginas, mas o PPTX tem {expected} slides",
        )
    return SlideRenderResult(pdf_path=pdf_path, images=images)
