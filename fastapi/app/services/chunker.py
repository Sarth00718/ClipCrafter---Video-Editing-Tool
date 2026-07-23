"""
Intelligent document chunking with section-awareness and metadata preservation.

Supports:
  - Fixed-size chunking with configurable overlap
  - Section-aware splitting (respects heading boundaries when metadata is available)
  - Metadata propagation to every chunk (source file, page, heading, slide)
"""

from __future__ import annotations

import re
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger
from app.models.schemas import ChunkMetadata, TextChunk
from app.utils.helpers import generate_document_id

logger = get_logger(__name__)


class DocumentChunker:
    """Split parsed document pages into semantically useful chunks."""

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ):
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap

    # ────────────────────────── Public API ─────────────────────────

    def chunk_document(
        self,
        pages: list[dict],
        source_file: str,
    ) -> list[TextChunk]:
        """Chunk an entire document (list of page dicts) into TextChunks.

        Args:
            pages: Output of a DocumentParser.parse() call.
            source_file: Original filename for metadata tagging.

        Returns:
            List of TextChunk objects with metadata.
        """
        all_chunks: list[TextChunk] = []

        for page in pages:
            text: str = page.get("text", "")
            if not text.strip():
                continue

            page_number = page.get("page_number")
            slide_number = page.get("slide_number")
            section_heading = page.get("section_heading")

            raw_chunks = self._split_text(text)

            for idx, chunk_text in enumerate(raw_chunks):
                chunk_id = f"{generate_document_id()[:8]}_{page_number or slide_number or 0}_{idx}"
                meta = ChunkMetadata(
                    chunk_id=chunk_id,
                    source_file=source_file,
                    page_number=page_number,
                    slide_number=slide_number,
                    section_heading=section_heading,
                )
                all_chunks.append(TextChunk(text=chunk_text, metadata=meta))

        logger.info(
            "Chunked '%s' into %d chunks (size=%d, overlap=%d)",
            source_file,
            len(all_chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return all_chunks

    # ────────────────────────── Internal ───────────────────────────

    def _split_text(self, text: str) -> list[str]:
        """Split text into overlapping windows of roughly chunk_size characters.

        Prefers splitting at paragraph or sentence boundaries when possible.
        """
        # First try paragraph-level splits
        paragraphs = re.split(r"\n{2,}", text)
        segments = self._merge_small_segments(paragraphs)

        # If we only get one huge segment, fall back to sentence-level
        if len(segments) == 1 and len(segments[0]) > self.chunk_size * 1.5:
            segments = self._sentence_split(segments[0])

        # Final fixed-window pass to enforce chunk_size
        return self._fixed_window(segments)

    def _merge_small_segments(self, segments: list[str]) -> list[str]:
        """Merge very small consecutive segments so we don't get tiny chunks."""
        merged: list[str] = []
        buffer = ""
        for seg in segments:
            seg = seg.strip()
            if not seg:
                continue
            if len(buffer) + len(seg) + 1 <= self.chunk_size:
                buffer = f"{buffer}\n{seg}".strip() if buffer else seg
            else:
                if buffer:
                    merged.append(buffer)
                buffer = seg
        if buffer:
            merged.append(buffer)
        return merged

    @staticmethod
    def _sentence_split(text: str) -> list[str]:
        """Split text into sentences (rough heuristic)."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _fixed_window(self, segments: list[str]) -> list[str]:
        """Apply fixed-window chunking with overlap across the flattened text."""
        full_text = "\n".join(segments)
        if len(full_text) <= self.chunk_size:
            return [full_text] if full_text.strip() else []

        chunks: list[str] = []
        start = 0
        while start < len(full_text):
            end = start + self.chunk_size
            chunk = full_text[start:end]

            # Try to end at a sentence boundary
            if end < len(full_text):
                last_period = chunk.rfind(".")
                if last_period > self.chunk_size * 0.4:
                    end = start + last_period + 1
                    chunk = full_text[start:end]

            chunk = chunk.strip()
            if chunk:
                chunks.append(chunk)

            start = end - self.chunk_overlap
            if start >= len(full_text):
                break

        return chunks
