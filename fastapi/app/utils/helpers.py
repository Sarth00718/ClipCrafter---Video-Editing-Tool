"""
General-purpose utility helpers used across the application.
"""

import re
import uuid
from pathlib import Path
from typing import Optional

from app.core.logger import get_logger

logger = get_logger(__name__)

# Allowed file extensions (lowercase, without dot)
ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "txt", "csv", "xlsx", "md"}


def generate_document_id() -> str:
    """Generate a unique document identifier."""
    return uuid.uuid4().hex[:16]


def validate_file_extension(filename: str) -> bool:
    """Return True if the filename has an allowed extension."""
    ext = Path(filename).suffix.lstrip(".").lower()
    return ext in ALLOWED_EXTENSIONS


def get_file_extension(filename: str) -> str:
    """Extract lowercase extension without the leading dot."""
    return Path(filename).suffix.lstrip(".").lower()


def clean_text(text: str) -> str:
    """Normalise whitespace and remove common noise from extracted text.

    - Collapses multiple blank lines into a single one
    - Strips trailing whitespace per line
    - Removes very short orphan lines (likely headers/footers)
    - Normalises unicode dashes / quotes
    """
    # Normalise unicode artifacts
    text = text.replace("\u2018", "'").replace("\u2019", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2013", "-").replace("\u2014", "-")

    # Collapse runs of whitespace on each line
    lines = [line.rstrip() for line in text.splitlines()]

    # Remove very short orphan lines (< 4 chars, likely page nums / artefacts)
    cleaned: list[str] = []
    for line in lines:
        stripped = line.strip()
        if len(stripped) < 4 and stripped.isdigit():
            continue  # skip standalone page numbers
        cleaned.append(line)

    # Collapse multiple blank lines
    result = re.sub(r"\n{3,}", "\n\n", "\n".join(cleaned))
    return result.strip()


def truncate_text(text: str, max_chars: int) -> str:
    """Truncate text to *max_chars*, ending at the last full sentence if possible."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    # Try to cut at the last sentence boundary
    last_period = truncated.rfind(".")
    if last_period > max_chars * 0.5:
        return truncated[: last_period + 1]
    return truncated + "..."


def extract_document_metadata(text: str) -> dict:
    """Best-effort extraction of title and authors from the first few lines."""
    lines = [l.strip() for l in text.split("\n") if l.strip()][:10]
    metadata: dict = {}

    if lines:
        # Heuristic: first non-empty line is likely the title
        metadata["extracted_title"] = lines[0]

    # Look for author-like patterns
    for line in lines[1:5]:
        if re.search(r"(author|by\s)", line, re.IGNORECASE):
            metadata["extracted_authors"] = line
            break

    return metadata
