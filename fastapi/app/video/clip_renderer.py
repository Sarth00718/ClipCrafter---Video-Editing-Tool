import os
from typing import Optional, List
import moviepy as mp
from moviepy import ImageClip, AudioFileClip, concatenate_videoclips

from app.core.logger import get_logger
from app.utils.ffmpeg_utils import FFmpegUtils

logger = get_logger(__name__)

# Standard resolution for educational videos
VIDEO_W = 1280
VIDEO_H = 720

class SceneClipService:
    """Renders final video clips by combining static images with synchronized audio."""

    @staticmethod
    def render_scene_clip(
        image_path: str,
        audio_path: str,
        output_path: str,
        subtitle_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Combines an image and an audio file into an MP4 video clip.
        Handles resizing, padding to 720p, and precise audio duration matching.
        Optionally burns in subtitles.
        
        Args:
            image_path: Path to scene image
            audio_path: Path to scene audio
            output_path: Path to save video clip
            subtitle_path: Optional path to SRT subtitle file
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio not found at {audio_path}")
            
        logger.info(f"Rendering scene clip: {os.path.basename(output_path)}")
        
        try:
            # 1. Load Audio and get duration
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration
            
            if duration <= 0:
                logger.warning(f"Audio file {audio_path} has zero duration. Skipping.")
                return None

            # 2. Load Image and prepare background/padding
            # We use a black background to pad different aspect ratios
            image_clip = ImageClip(image_path).with_duration(duration)
            
            # 3. Resize with aspect ratio preservation
            # MoviePy 2.x resizing logic
            image_clip = image_clip.resized(height=VIDEO_H)
            if image_clip.w > VIDEO_W:
                image_clip = image_clip.resized(width=VIDEO_W)
            
            # Center the image on a 1280x720 black frame using CompositeVideoClip
            final_clip = mp.CompositeVideoClip(
                [image_clip.with_position("center")],
                size=(VIDEO_W, VIDEO_H)
            ).with_duration(duration)
            
            # 4. Attach Audio
            final_clip = final_clip.with_audio(audio_clip)
            
            # 5. Write to file
            # We use 'ultrafast' for scene clips to be snappy; final render can be higher quality
            final_clip.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                preset="ultrafast",
                logger=None,
                threads=4
            )
            
            # 6. Cleanup
            audio_clip.close()
            image_clip.close()
            final_clip.close()
            
            # 7. Add subtitles if provided (using FFmpeg)
            if subtitle_path and os.path.exists(subtitle_path):
                try:
                    temp_output = output_path + ".temp.mp4"
                    os.rename(output_path, temp_output)
                    
                    FFmpegUtils.add_subtitles(temp_output, subtitle_path, output_path)
                    os.remove(temp_output)
                    
                    logger.info(f"Added subtitles to {output_path}")
                except Exception as e:
                    logger.warning(f"Failed to add subtitles: {e}")
                    # Restore original if subtitle addition failed
                    if os.path.exists(temp_output):
                        os.rename(temp_output, output_path)
            
            logger.info(f"Successfully rendered: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to render scene clip {output_path}: {e}")
            raise RuntimeError(f"Scene clip rendering failed: {e}")


class FinalRenderService:
    """Concatenates pre-rendered scene clips into a single high-quality video."""

    @staticmethod
    def concatenate_scene_clips(clip_paths: List[str], final_output_path: str) -> Optional[str]:
        """
        Assembles a list of MP4 clips into one final video.
        Uses FFmpeg concat for faster processing when possible, falls back to MoviePy.
        """
        if not clip_paths:
            logger.error("No clips provided for final rendering.")
            return None

        logger.info(f"Starting final render for {len(clip_paths)} clips...")
        
        # Try FFmpeg concat first (faster)
        try:
            return FFmpegUtils.merge_videos_concat(clip_paths, final_output_path)
        except Exception as e:
            logger.warning(f"FFmpeg concat failed, falling back to MoviePy: {e}")
        
        # Fallback to MoviePy
        try:
            clips = []
            for path in clip_paths:
                if os.path.exists(path):
                    clips.append(mp.VideoFileClip(path))
                else:
                    logger.warning(f"Missing clip during final render: {path}")

            if not clips:
                raise ValueError("No valid clip files found for concatenation.")

            # Concatenate clips sequentially
            final_video = concatenate_videoclips(clips, method="compose")
            
            # Write final high-quality output
            final_video.write_videofile(
                final_output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                preset="medium", # Better compression for final export
                logger=None,
                threads=4
            )

            # Cleanup
            for clip in clips:
                clip.close()
            final_video.close()

            logger.info(f"Final video assembly complete: {final_output_path}")
            return final_output_path

        except Exception as e:
            logger.error(f"Final rendering failed: {e}")
            raise RuntimeError(f"Final video assembly failed: {e}")
