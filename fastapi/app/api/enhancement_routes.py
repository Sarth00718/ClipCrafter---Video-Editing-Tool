"""
Script enhancement and scene regeneration routes.
Provides endpoints for improving scripts and regenerating specific scenes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.api.routes import _get_doc, _load_script, _save_script
from app.api.video_routes import _get_project_metadata, _get_scene, _update_scene
from app.core.logger import get_logger
from app.models.schemas import ScriptResponse, ScriptSection
from app.models.video_schemas import SceneResponse, AssetStatus, SceneStatus
from app.rag.script_generator import ScriptGenerator
from app.video.visual_planner import VisualPlannerService
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter(tags=["Script Enhancement"])


# ── Request/Response Models ────────────────────────────────────────


class EnhanceScriptRequest(BaseModel):
    """Request to enhance an existing script."""
    focus_on_clarity: bool = Field(default=True, description="Improve clarity and readability")
    focus_on_storytelling: bool = Field(default=True, description="Enhance narrative flow")
    preserve_structure: bool = Field(default=True, description="Keep scene order and headings")


class RegenerateSceneRequest(BaseModel):
    """Request to regenerate specific scene elements."""
    regenerate_script: bool = Field(default=True, description="Regenerate script_line/narration")
    regenerate_prompt: bool = Field(default=True, description="Regenerate image_prompt")
    custom_instructions: Optional[str] = Field(None, description="Additional instructions for LLM")


class UpdateSceneDurationRequest(BaseModel):
    """Request to update scene duration."""
    duration: float = Field(..., gt=0, description="New duration in seconds")


# ── Script Enhancement ──────────────────────────────────────────────


@router.post("/enhance-script/{document_id}", response_model=ScriptResponse)
async def enhance_script(document_id: str, request: EnhanceScriptRequest = EnhanceScriptRequest()):
    """
    Enhance an existing script for better clarity and storytelling.
    
    IMPORTANT: This preserves:
    - Scene order
    - Scene durations
    - Scene headings
    - Visual cues
    
    Only enhances:
    - Narration text
    - Script lines
    - Clarity and flow
    """
    doc = _get_doc(document_id)
    
    # Load existing script
    script = _load_script(document_id)
    if not script:
        raise HTTPException(status_code=404, detail="No script found for this document")
    
    try:
        logger.info(f"Enhancing script for document {document_id}")
        
        # Build enhancement prompt
        enhancement_instructions = []
        if request.focus_on_clarity:
            enhancement_instructions.append(
                "Improve clarity and readability while maintaining technical accuracy"
            )
        if request.focus_on_storytelling:
            enhancement_instructions.append(
                "Enhance narrative flow and engagement while keeping the educational focus"
            )
        
        instructions = " and ".join(enhancement_instructions)
        
        # Create enhancement prompt
        enhancement_prompt = f"""
You are enhancing an educational video script. Your task is to {instructions}.

CRITICAL RULES:
1. DO NOT change scene order
2. DO NOT change scene headings
3. DO NOT change scene durations significantly
4. DO NOT change the core educational content
5. ONLY improve the narration text for better clarity and engagement

Original Script:
Title: {script.title}
Target Audience: {script.target_audience}

Hook: {script.hook}

Introduction: {script.introduction}

Main Sections:
{chr(10).join([f"- {s.heading}: {s.narration}" for s in script.main_sections])}

Conclusion: {script.conclusion}

Key Takeaways: {', '.join(script.key_takeaways)}

Please return an enhanced version with improved narration while preserving all structure.
Return in the same JSON format as the original script.
"""
        
        # Use ScriptGenerator to enhance
        generator = ScriptGenerator()
        raw_response = generator._call_llm(enhancement_prompt)
        enhanced_script = generator._parse_response(raw_response, document_id)
        
        # Preserve original structure if requested
        if request.preserve_structure:
            enhanced_script.title = script.title
            enhanced_script.target_audience = script.target_audience
            enhanced_script.estimated_duration = script.estimated_duration
            enhanced_script.visual_cues = script.visual_cues
            
            # Ensure same number of sections
            if len(enhanced_script.main_sections) != len(script.main_sections):
                logger.warning("Section count mismatch, using original sections")
                enhanced_script.main_sections = script.main_sections
        
        # Save enhanced script
        _save_script(document_id, enhanced_script)
        
        logger.info(f"Script enhanced successfully for {document_id}")
        return enhanced_script
        
    except Exception as e:
        logger.error(f"Script enhancement failed for {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Script enhancement failed: {str(e)}")


# ── Scene Regeneration ──────────────────────────────────────────────


@router.post("/regenerate-scene/{project_id}/{scene_id}", response_model=SceneResponse)
async def regenerate_scene(
    project_id: str,
    scene_id: str,
    request: RegenerateSceneRequest = RegenerateSceneRequest()
):
    """
    Regenerate specific elements of a scene using LLM.
    
    IMPORTANT: This preserves:
    - Visual style
    - Text overlays
    - Concept summary
    - Narration text (unless explicitly regenerated)
    - Transitions
    - Scene order
    - Duration
    - Scene heading
    - Visual cues
    - Camera roles
    
    Only regenerates:
    - Script line (if requested)
    - Image prompt (if requested)
    """
    scene = _get_scene(project_id, scene_id)
    
    try:
        logger.info(f"Regenerating scene {scene_id} in project {project_id}")
        
        # Build regeneration prompt
        regeneration_prompt = f"""
You are regenerating specific elements of an educational video scene.

Scene Information:
- Heading: {scene.heading}
- Current Narration: {scene.narration_text}
- Current Visual Prompt: {scene.visual_prompt}
- Concept Summary: {scene.concept_summary or 'Not set'}

Custom Instructions: {request.custom_instructions or 'None'}

CRITICAL RULES:
1. Keep the same educational concept and topic
2. Maintain consistency with the scene heading
3. Do not change the scene's core message
4. Ensure narration and visual prompt are aligned

Tasks:
"""
        
        if request.regenerate_script:
            regeneration_prompt += "\n- Generate an improved narration text that is clearer and more engaging"
        
        if request.regenerate_prompt:
            regeneration_prompt += "\n- Generate an improved image prompt that better illustrates the concept"
        
        regeneration_prompt += """

Return a JSON object with:
{
  "narration_text": "improved narration (if requested)",
  "visual_prompt": "improved visual prompt (if requested)"
}
"""
        
        # Use ScriptGenerator to regenerate
        generator = ScriptGenerator()
        raw_response = generator._call_llm(regeneration_prompt)
        
        # Parse response
        import json
        import re
        
        cleaned = raw_response.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM response for scene regeneration")
            raise HTTPException(status_code=500, detail="Failed to parse LLM response")
        
        # Update scene with regenerated content
        if request.regenerate_script and "narration_text" in data:
            scene.narration_text = data["narration_text"]
            scene.subtitle_text = data["narration_text"]
            scene.audio_status = AssetStatus.MISSING
            scene.clip_status = AssetStatus.MISSING
        
        if request.regenerate_prompt and "visual_prompt" in data:
            scene.visual_prompt = data["visual_prompt"]
            scene.enriched_prompt = None  # Will be regenerated
            scene.image_status = AssetStatus.MISSING
            scene.clip_status = AssetStatus.MISSING
        
        scene.status = SceneStatus.PROCESSING
        _update_scene(project_id, scene_id, scene)
        
        logger.info(f"Scene {scene_id} regenerated successfully")
        return scene
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scene regeneration failed for {scene_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Scene regeneration failed: {str(e)}")


# ── Scene Duration Update ───────────────────────────────────────────


@router.patch("/update-scene-duration/{project_id}/{scene_id}", response_model=SceneResponse)
async def update_scene_duration(
    project_id: str,
    scene_id: str,
    request: UpdateSceneDurationRequest
):
    """
    Update the duration of a scene.
    This marks audio and clip as needing regeneration.
    """
    scene = _get_scene(project_id, scene_id)
    
    try:
        old_duration = scene.estimated_duration
        scene.estimated_duration = request.duration
        
        # Mark assets as needing regeneration
        scene.audio_status = AssetStatus.MISSING
        scene.clip_status = AssetStatus.MISSING
        scene.status = SceneStatus.PROCESSING
        
        _update_scene(project_id, scene_id, scene)
        
        logger.info(
            f"Updated scene {scene_id} duration from {old_duration}s to {request.duration}s"
        )
        return scene
        
    except Exception as e:
        logger.error(f"Failed to update scene duration: {e}")
        raise HTTPException(status_code=500, detail=f"Duration update failed: {str(e)}")


# ── Batch Scene Regeneration ────────────────────────────────────────


@router.post("/regenerate-all-prompts/{project_id}")
async def regenerate_all_prompts(project_id: str, image_style: str = "cinematic_educational"):
    """
    Regenerate image prompts for all scenes in a project.
    Useful when you want to refresh all visuals with a new style.
    """
    metadata = _get_project_metadata(project_id)
    
    try:
        regenerated_count = 0
        errors = []
        
        for scene in metadata.scenes:
            try:
                # Use visual planner to regenerate prompt
                visual_plan = await VisualPlannerService.enrich_scene_visuals(
                    scene, image_style
                )
                
                scene.enriched_prompt = visual_plan.enriched_image_prompt
                scene.negative_prompt = visual_plan.negative_prompt
                scene.style_preset = image_style
                scene.image_status = AssetStatus.MISSING
                scene.clip_status = AssetStatus.MISSING
                
                _update_scene(project_id, scene.scene_id, scene)
                regenerated_count += 1
                
            except Exception as e:
                error_msg = f"Scene {scene.scene_id}: {str(e)}"
                errors.append(error_msg)
                logger.error(f"Failed to regenerate prompt for {scene.scene_id}: {e}")
        
        return {
            "project_id": project_id,
            "regenerated_count": regenerated_count,
            "failed_count": len(errors),
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Batch prompt regeneration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
