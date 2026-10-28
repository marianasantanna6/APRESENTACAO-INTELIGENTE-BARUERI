"""Validated HTTP request contracts for presentation generation."""

from __future__ import annotations

import json
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


MAX_CONTEXT_CHARS = 20_000


class ProjectAwardRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    institution: str = Field(min_length=1, max_length=300)
    year: int = Field(ge=1900, le=2200)
    description: str | None = Field(default=None, max_length=2_000)
    link: str | None = Field(default=None, max_length=2_000)


class ProjectIndicatorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    label: str = Field(min_length=1, max_length=300)
    value: str = Field(min_length=1, max_length=300)
    measure: str | None = Field(default=None, max_length=100)
    source: str = Field(min_length=1, max_length=500)
    year: int = Field(ge=1900, le=2200)


class ProjectGenerationRequest(BaseModel):
    """Project DTO currently produced by the backend."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=300)
    user: str | int
    team: str | int
    family: int = Field(ge=0)

    short_description: str | None = Field(default=None, max_length=2_000)
    full_description: str | None = Field(default=None, max_length=10_000)
    source: list[str] = Field(min_length=1, max_length=20)
    main_department: str = Field(min_length=1, max_length=300)
    related_departments: list[str] = Field(max_length=30)
    areas: list[str] = Field(max_length=30)
    ods: list[int] = Field(max_length=17)
    theme: str | None = Field(default=None, max_length=500)
    audience: str | None = Field(default=None, max_length=500)
    technologies: list[str] = Field(max_length=50)
    implementation_date: date | None = None
    awards: list[ProjectAwardRequest] = Field(default_factory=list, max_length=50)
    indicators: list[ProjectIndicatorRequest] = Field(default_factory=list, max_length=100)
    keywords: list[str] = Field(max_length=100)

    @model_validator(mode="after")
    def validate_request_size_and_ods(self) -> "ProjectGenerationRequest":
        if any(ods < 1 or ods > 17 for ods in self.ods):
            raise ValueError("'ods' aceita somente os objetivos de 1 a 17.")
        serialized = json.dumps(self.model_dump(mode="json"), ensure_ascii=False)
        if len(serialized) > MAX_CONTEXT_CHARS:
            raise ValueError(
                "Os dados do projeto excedem o limite de "
                f"{MAX_CONTEXT_CHARS} caracteres."
            )
        return self

    @property
    def query(self) -> str:
        """Build a bounded research query from the project's descriptive fields."""
        parts = [
            self.name,
            self.theme or "",
            self.short_description or "",
            " ".join(self.keywords),
        ]
        return " ".join(" ".join(parts).split())[:300]

    def to_prompt_context(self) -> dict[str, Any]:
        """Exclude backend identity fields from presentation-facing context."""
        project = self.model_dump(
            mode="json",
            exclude={"user", "team", "family"},
            exclude_none=True,
        )
        return {
            "consulta": self.query,
            "projeto": project,
            "observacao": (
                "Dados fornecidos pelo backend; campos administrativos foram omitidos."
            ),
        }

    def to_project_source_text(self) -> str:
        """Serialize project content for an explicitly unverified provenance source."""
        return json.dumps(self.to_prompt_context()["projeto"], ensure_ascii=False, indent=2)


class LegacyResearchRequest(BaseModel):
    """Compatibility contract for callers that still send a topic only."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    tema: str | None = Field(default=None, min_length=1, max_length=300)
    prompt: str | None = Field(default=None, min_length=1, max_length=300)

    @model_validator(mode="after")
    def validate_query(self) -> "LegacyResearchRequest":
        if not self.tema and not self.prompt:
            raise ValueError("Envie 'prompt', o campo legado 'tema' ou o DTO do projeto.")
        return self

    @property
    def query(self) -> str:
        return (self.prompt or self.tema or "").strip()

    def to_prompt_context(self) -> dict[str, Any]:
        return {}
