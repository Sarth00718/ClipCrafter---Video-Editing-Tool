import json
import os
from typing import Optional, List

from app.core.config import settings
from app.models.video_schemas import ProjectMetadata, SceneResponse
from app.core.logger import get_logger

logger = get_logger(__name__)


class ProjectMetadataManager:
    """
    Manages the persistence of project metadata (scenes state, paths) 
    and handles creation of required subdirectories for a project.
    """

    @classmethod
    def get_project_dir(cls, project_id: str) -> str:
        base_dir = settings.resolve_path(settings.projects_dir)
        proj_dir = os.path.join(base_dir, project_id)
        os.makedirs(proj_dir, exist_ok=True)
        return proj_dir

    @classmethod
    def setup_project_directories(cls, project_id: str):
        """Creates the nested folder structure for scenes, audio, images, clips."""
        proj_dir = cls.get_project_dir(project_id)
        
        for sub in ["scenes", "audio", "images", "clips", "renders"]:
            os.makedirs(os.path.join(proj_dir, sub), exist_ok=True)
            
        logger.info(f"Set up project directories for {project_id}")

    @classmethod
    def save_metadata(cls, metadata: ProjectMetadata):
        """Persist the master project metadata to a JSON file."""
        proj_dir = cls.get_project_dir(metadata.project_id)
        file_path = os.path.join(proj_dir, "metadata.json")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(metadata.model_dump_json(indent=2))

    @classmethod
    def load_metadata(cls, project_id: str) -> Optional[ProjectMetadata]:
        proj_dir = cls.get_project_dir(project_id)
        file_path = os.path.join(proj_dir, "metadata.json")
        
        if not os.path.exists(file_path):
            return None
            
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return ProjectMetadata.model_validate(data)

    @classmethod
    def update_scene_status(cls, project_id: str, scene_id: str, new_scene: SceneResponse):
        """Update a specific scene inside the project metadata."""
        metadata = cls.load_metadata(project_id)
        if not metadata:
            return
            
        for i, scene in enumerate(metadata.scenes):
            if scene.scene_id == scene_id:
                metadata.scenes[i] = new_scene
                break
                
        cls.save_metadata(metadata)


class TimelineService:
    """Generates a timeline configuration for final video assembly."""

    @staticmethod
    def generate_timeline(metadata: ProjectMetadata) -> str:
        """
        Creates a simple text-based timeline file mapping out valid clip paths 
        in sequential order. This prepares the system for full-video concatenation.
        """
        proj_dir = ProjectMetadataManager.get_project_dir(metadata.project_id)
        timeline_path = os.path.join(proj_dir, "timeline.txt")
        
        valid_clips = []
        for scene in sorted(metadata.scenes, key=lambda s: s.scene_order):
            if scene.clip_path and os.path.exists(scene.clip_path):
                # Format required by ffmpeg concat demuxer
                valid_clips.append(f"file '{os.path.abspath(scene.clip_path)}'")
                
        if not valid_clips:
            raise ValueError("No valid completed scenes available to build timeline.")
            
        with open(timeline_path, "w", encoding="utf-8") as f:
            f.write("\n".join(valid_clips))
            
        logger.info(f"Generated timeline for project {metadata.project_id} with {len(valid_clips)} scenes.")
        return timeline_path
