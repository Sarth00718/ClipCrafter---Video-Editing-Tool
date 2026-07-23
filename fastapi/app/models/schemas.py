"""
Pydantic models for request/response schemas across the entire API.
All models are JSON-serialisable and Swagger-friendly.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ────────────────────────────── Enums ──────────────────────────────


class DocumentStatusEnum(str, enum.Enum):
    """Lifecycle states the document can be in."""
    UPLOADED = "uploaded"
    PARSING = "parsing"
    PARSED = "parsed"
    INDEXING = "indexing"
    INDEXED = "indexed"
    GENERATING = "generating"
    GENERATED = "generated"
    FAILED = "failed"


class ToneEnum(str, enum.Enum):
    """Supported narration tones."""
    ACADEMIC = "academic"
    BEGINNER_FRIENDLY = "beginner-friendly"
    PROFESSIONAL = "professional"
    YOUTUBE_EXPLAINER = "youtube-explainer"


class DepthEnum(str, enum.Enum):
    """Script depth level."""
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"


# ────────────────────────────── Chunks & Metadata ──────────────────


class ChunkMetadata(BaseModel):
    """Metadata attached to every text chunk."""
    chunk_id: str
    source_file: str
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    section_heading: Optional[str] = None
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class TextChunk(BaseModel):
    """A single chunk of parsed document text with its metadata."""
    text: str
    metadata: ChunkMetadata


# ────────────────────────────── Upload ─────────────────────────────


class UploadResponse(BaseModel):
    """Response after a successful document upload."""
    document_id: str
    filename: str
    file_size_bytes: int
    status: DocumentStatusEnum = DocumentStatusEnum.UPLOADED
    message: str = "Document uploaded successfully."


# ────────────────────────────── Document Status ────────────────────


class DocumentStatusResponse(BaseModel):
    """Current processing status of a document."""
    document_id: str
    filename: str
    status: DocumentStatusEnum
    created_at: datetime
    updated_at: datetime
    error: Optional[str] = None
    chunk_count: Optional[int] = None


# ────────────────────────────── Script Request ─────────────────────


class ScriptRequest(BaseModel):
    """User-controllable parameters for script generation."""
    goal: str = Field(
        default="Generate a 3-minute beginner-friendly video script",
        description="High-level instruction for what kind of script to produce.",
    )
    target_audience: str = Field(default="general audience")
    tone: ToneEnum = Field(default=ToneEnum.BEGINNER_FRIENDLY)
    duration_minutes: int = Field(default=3, ge=1, le=30)
    output_language: str = Field(default="English")
    depth: DepthEnum = Field(default=DepthEnum.MEDIUM)
    focus_areas: list[str] = Field(
        default_factory=list,
        description="Sections to emphasise, e.g. ['methodology', 'results'].",
    )
    include_analogies: bool = Field(default=True)
    include_visual_cues: bool = Field(default=True)


# ────────────────────────────── Script Response ────────────────────


class ScriptSection(BaseModel):
    """A single section within the generated video script."""
    heading: str
    summary: str
    narration: str
    suggested_visuals: list[str] = Field(default_factory=list)
    source_chunk_ids: list[str] = Field(default_factory=list)


class ScriptResponse(BaseModel):
    """Full structured video script returned to the client."""
    document_id: str
    title: str
    target_audience: str
    estimated_duration: str
    hook: str
    introduction: str
    main_sections: list[ScriptSection]
    conclusion: str
    key_takeaways: list[str]
    narration_script: str
    visual_cues: list[str] = Field(default_factory=list)
    source_coverage_notes: str = ""
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ────────────────────────────── Search ─────────────────────────────


class SearchRequest(BaseModel):
    """Payload for the similarity-search endpoint."""
    query: str
    top_k: int = Field(default=5, ge=1, le=50)


class SearchResult(BaseModel):
    """Single search hit with score and metadata."""
    chunk_id: str
    text: str
    score: float
    metadata: ChunkMetadata


class SearchResponse(BaseModel):
    """Collection of similarity-search results."""
    document_id: str
    query: str
    results: list[SearchResult]


# ────────────────────────────── Health ─────────────────────────────


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
