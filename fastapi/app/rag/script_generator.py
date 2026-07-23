"""
RAG-based script generation using Groq LLM.

Handles:
  - Token-safe context construction (truncation if too long)
  - Prompt assembly from templates
  - Groq API call with retry / timeout
  - JSON parsing of the model output
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any

from groq import Groq
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.logger import get_logger
from app.models.schemas import ScriptRequest, ScriptResponse, ScriptSection
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.prompts.user_prompt import build_user_prompt
from app.utils.helpers import truncate_text

logger = get_logger(__name__)

# Rough token-to-char ratio (1 token ≈ 4 chars for English text)
_CHARS_PER_TOKEN = 4
# Reserve tokens for system prompt + user chrome + response
_MAX_CONTEXT_TOKENS = 24_000  # safe limit for 32k context models
_MAX_CONTEXT_CHARS = _MAX_CONTEXT_TOKENS * _CHARS_PER_TOKEN


class ScriptGenerator:
    """Generate an educational video script from retrieved context via Groq."""

    def __init__(self):
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not set. Please configure it in .env")
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model_name

    # ────────────────────────── Public API ─────────────────────────

    def generate(
        self,
        retrieved_chunks: list[dict],
        request: ScriptRequest,
        document_id: str,
    ) -> ScriptResponse:
        """End-to-end script generation.

        Args:
            retrieved_chunks: Output from Retriever.retrieve().
            request: User-controlled script parameters.
            document_id: Unique document identifier for tagging.

        Returns:
            Fully structured ScriptResponse.
        """
        context_blocks = self._build_context(retrieved_chunks)
        user_prompt = build_user_prompt(
            context_blocks=context_blocks,
            goal=request.goal,
            target_audience=request.target_audience,
            tone=request.tone.value,
            duration_minutes=request.duration_minutes,
            output_language=request.output_language,
            depth=request.depth.value,
            focus_areas=request.focus_areas,
            include_analogies=request.include_analogies,
            include_visual_cues=request.include_visual_cues,
        )

        raw_json = self._call_llm(user_prompt)
        return self._parse_response(raw_json, document_id)

    # ────────────────────────── Context Construction ──────────────

    def _build_context(self, chunks: list[dict]) -> str:
        """Format retrieved chunks into a labelled context block.

        Applies truncation if total char count exceeds safe limits.
        """
        lines: list[str] = []
        total_chars = 0

        for chunk in chunks:
            chunk_id = chunk["metadata"].get("chunk_id", "unknown")
            source = chunk["metadata"].get("source_file", "")
            page = chunk["metadata"].get("page_number", "")
            heading = chunk["metadata"].get("section_heading", "")
            score = chunk.get("score", 0)

            header = f"[Chunk {chunk_id} | source={source} page={page} heading={heading} score={score:.3f}]"
            text = chunk["text"]

            # Check if adding this chunk would exceed our budget
            entry = f"{header}\n{text}\n"
            if total_chars + len(entry) > _MAX_CONTEXT_CHARS:
                # Truncate this chunk to fit within budget
                remaining = _MAX_CONTEXT_CHARS - total_chars - len(header) - 20
                if remaining > 200:
                    text = truncate_text(text, remaining)
                    entry = f"{header}\n{text}\n"
                    lines.append(entry)
                break

            lines.append(entry)
            total_chars += len(entry)

        logger.info("Built context block with %d chunks (%d chars)", len(lines), total_chars)
        return "\n".join(lines)

    # ────────────────────────── LLM Call ───────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=15),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def _call_llm(self, user_prompt: str) -> str:
        """Call Groq chat completion with retry logic."""
        logger.info("Calling Groq (%s)…", self.model)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=4096,
            top_p=0.9,
        )

        content = response.choices[0].message.content
        logger.info("Groq response received (%d chars)", len(content or ""))
        return content or ""

    # ────────────────────────── Response Parsing ──────────────────

    def _parse_response(self, raw: str, document_id: str) -> ScriptResponse:
        """Parse the raw LLM output into a ScriptResponse.

        Handles cases where the model wraps JSON in code fences.
        """
        # Strip markdown code fences if present
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            data: dict[str, Any] = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse LLM JSON output: %s", exc)
            # Return a fallback response with the raw text as narration
            return ScriptResponse(
                document_id=document_id,
                title="Script Generation (raw output)",
                target_audience="unknown",
                estimated_duration="unknown",
                hook="",
                introduction="",
                main_sections=[],
                conclusion="",
                key_takeaways=[],
                narration_script=raw,
                source_coverage_notes="LLM output could not be parsed as JSON.",
            )

        # Build ScriptSection objects
        sections = []
        for sec in data.get("main_sections", []):
            sections.append(ScriptSection(
                heading=sec.get("heading", ""),
                summary=sec.get("summary", ""),
                narration=sec.get("narration", ""),
                suggested_visuals=sec.get("suggested_visuals", []),
                source_chunk_ids=sec.get("source_chunk_ids", []),
            ))

        return ScriptResponse(
            document_id=document_id,
            title=data.get("title", "Untitled Script"),
            target_audience=data.get("target_audience", ""),
            estimated_duration=data.get("estimated_duration", ""),
            hook=data.get("hook", ""),
            introduction=data.get("introduction", ""),
            main_sections=sections,
            conclusion=data.get("conclusion", ""),
            key_takeaways=data.get("key_takeaways", []),
            narration_script=data.get("narration_script", ""),
            visual_cues=data.get("visual_cues", []),
            source_coverage_notes=data.get("source_coverage_notes", ""),
            generated_at=datetime.utcnow(),
        )
