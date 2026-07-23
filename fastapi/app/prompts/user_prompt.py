"""
User prompt template with placeholders filled at runtime.
"""


def build_user_prompt(
    context_blocks: str,
    goal: str,
    target_audience: str,
    tone: str,
    duration_minutes: int,
    output_language: str,
    depth: str,
    focus_areas: list[str],
    include_analogies: bool,
    include_visual_cues: bool,
) -> str:
    """Construct the user message sent alongside the system prompt.

    Args:
        context_blocks: Formatted retrieved chunks with chunk IDs.
        goal: High-level user goal (e.g. "Explain the methodology").
        target_audience: Who the video is for.
        tone: Tone enum value string.
        duration_minutes: Approximate target duration.
        output_language: Language for the script.
        depth: short / medium / long.
        focus_areas: List of sections to emphasise.
        include_analogies: Whether to use analogies.
        include_visual_cues: Whether to suggest visuals per section.

    Returns:
        A complete user prompt string.
    """
    focus = ", ".join(focus_areas) if focus_areas else "all major topics"
    analogy_instruction = (
        "Use relatable analogies to explain complex concepts."
        if include_analogies
        else "Avoid analogies; keep explanations direct."
    )
    visual_instruction = (
        "Include 2-3 specific visual suggestions per section."
        if include_visual_cues
        else "Skip the suggested_visuals field (leave empty lists)."
    )

    return f"""=== SOURCE DOCUMENT CONTEXT ===
{context_blocks}
=== END CONTEXT ===

USER GOAL: {goal}

SCRIPT PARAMETERS:
- Target audience: {target_audience}
- Tone: {tone}
- Approximate duration: {duration_minutes} minute(s) (~{duration_minutes * 150} words)
- Output language: {output_language}
- Depth: {depth}
- Focus areas: {focus}
- {analogy_instruction}
- {visual_instruction}

Based on the source context above, generate a complete, narration-ready video script.
Reference the chunk IDs in source_chunk_ids for each section so viewers can trace claims.
If any focus area is not covered in the source material, note that in source_coverage_notes.
Return ONLY valid JSON matching the structure from your instructions."""
