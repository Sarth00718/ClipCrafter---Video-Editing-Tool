"""
FFmpeg utility functions for video processing.
Handles FFmpeg detection, path resolution, and common video operations.
"""

import os
import subprocess
import shutil
from pathlib import Path
from typing import Optional, List, Tuple
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class FFmpegUtils:
    """Utility class for FFmpeg operations."""
    
    @staticmethod
    def get_ffmpeg_path() -> str:
        """
        Get FFmpeg executable path with fallback logic:
        1. Check configured path in settings
        2. Check local installation (fastapi/ffmpeg*/bin/)
        3. Check system PATH
        
        Returns:
            Absolute path to ffmpeg executable
            
        Raises:
            RuntimeError: If FFmpeg is not found
        """
        # 1. Try configured path
        if settings.ffmpeg_path:
            ffmpeg_path = Path(settings.ffmpeg_path)
            if not ffmpeg_path.is_absolute():
                ffmpeg_path = settings.project_root / settings.ffmpeg_path
            
            if ffmpeg_path.exists():
                logger.info(f"Using configured FFmpeg: {ffmpeg_path}")
                return str(ffmpeg_path)
        
        # 2. Try local installation
        local_ffmpeg = Path(settings.ffmpeg_executable)
        if local_ffmpeg.exists():
            logger.info(f"Using local FFmpeg: {local_ffmpeg}")
            return str(local_ffmpeg)
        
        # 3. Try system PATH
        system_ffmpeg = shutil.which("ffmpeg")
        if system_ffmpeg:
            logger.info(f"Using system FFmpeg: {system_ffmpeg}")
            return system_ffmpeg
        
        # Not found anywhere
        raise RuntimeError(
            "FFmpeg not found. Please install FFmpeg:\n"
            "1. Download from: https://ffmpeg.org/download.html\n"
            "2. Place in fastapi/ffmpeg/bin/ directory, OR\n"
            "3. Install system-wide and add to PATH, OR\n"
            "4. Set FFMPEG_PATH in .env file"
        )
    
    @staticmethod
    def get_ffprobe_path() -> str:
        """
        Get FFprobe executable path with fallback logic.
        Similar to get_ffmpeg_path() but for ffprobe.
        """
        # 1. Try configured path
        if settings.ffprobe_path:
            ffprobe_path = Path(settings.ffprobe_path)
            if not ffprobe_path.is_absolute():
                ffprobe_path = settings.project_root / settings.ffprobe_path
            
            if ffprobe_path.exists():
                return str(ffprobe_path)
        
        # 2. Try local installation
        local_ffprobe = Path(settings.ffprobe_executable)
        if local_ffprobe.exists():
            return str(local_ffprobe)
        
        # 3. Try system PATH
        system_ffprobe = shutil.which("ffprobe")
        if system_ffprobe:
            return system_ffprobe
        
        raise RuntimeError("FFprobe not found. Please install FFmpeg (includes ffprobe).")
    
    @staticmethod
    def check_ffmpeg_available() -> Tuple[bool, str]:
        """
        Check if FFmpeg is available and working.
        
        Returns:
            Tuple of (is_available, message)
        """
        try:
            ffmpeg_path = FFmpegUtils.get_ffmpeg_path()
            result = subprocess.run(
                [ffmpeg_path, "-version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                version_line = result.stdout.split('\n')[0]
                return True, f"FFmpeg available: {version_line}"
            else:
                return False, "FFmpeg found but not working properly"
                
        except Exception as e:
            return False, f"FFmpeg not available: {str(e)}"
    
    @staticmethod
    def merge_videos_concat(video_paths: List[str], output_path: str) -> str:
        """
        Merge multiple video files using FFmpeg concat demuxer.
        This is the fastest method for merging videos with identical codecs.
        
        Args:
            video_paths: List of video file paths to merge
            output_path: Output video path
            
        Returns:
            Path to merged video
        """
        if not video_paths:
            raise ValueError("No video paths provided for merging")
        
        # Create concat file
        concat_file = output_path + ".concat.txt"
        
        try:
            with open(concat_file, 'w') as f:
                for path in video_paths:
                    # Use absolute paths for safety
                    abs_path = os.path.abspath(path)
                    # Escape single quotes in path
                    escaped_path = abs_path.replace("'", "'\\''")
                    f.write(f"file '{escaped_path}'\n")
            
            ffmpeg_path = FFmpegUtils.get_ffmpeg_path()
            cmd = [
                ffmpeg_path,
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                "-y",
                output_path
            ]
            
            logger.info(f"Merging {len(video_paths)} videos with FFmpeg concat")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Successfully merged videos to {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg merge failed: {e.stderr}")
            raise RuntimeError(f"Video merge failed: {e.stderr}")
        finally:
            # Cleanup concat file
            if os.path.exists(concat_file):
                os.remove(concat_file)
    
    @staticmethod
    def add_subtitles(video_path: str, subtitle_path: str, output_path: str) -> str:
        """
        Add subtitles to video using FFmpeg.
        
        Args:
            video_path: Input video path
            subtitle_path: SRT subtitle file path
            output_path: Output video path
            
        Returns:
            Path to output video
        """
        ffmpeg_path = FFmpegUtils.get_ffmpeg_path()
        
        cmd = [
            ffmpeg_path,
            "-i", video_path,
            "-vf", f"subtitles={subtitle_path}",
            "-c:a", "copy",
            "-y",
            output_path
        ]
        
        try:
            logger.info(f"Adding subtitles to video")
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Subtitles added successfully")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to add subtitles: {e.stderr}")
            raise RuntimeError(f"Subtitle addition failed: {e.stderr}")
    
    @staticmethod
    def extract_audio(video_path: str, output_path: str, format: str = "mp3") -> str:
        """
        Extract audio from video.
        
        Args:
            video_path: Input video path
            output_path: Output audio path
            format: Audio format (mp3, wav, etc.)
            
        Returns:
            Path to extracted audio
        """
        ffmpeg_path = FFmpegUtils.get_ffmpeg_path()
        
        cmd = [
            ffmpeg_path,
            "-i", video_path,
            "-vn",  # No video
            "-acodec", "libmp3lame" if format == "mp3" else "pcm_s16le",
            "-q:a", "2",  # High quality
            "-y",
            output_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Extracted audio to {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Audio extraction failed: {e.stderr}")
            raise RuntimeError(f"Audio extraction failed: {e.stderr}")
    
    @staticmethod
    def get_video_duration(video_path: str) -> float:
        """
        Get video duration in seconds using FFprobe.
        
        Args:
            video_path: Path to video file
            
        Returns:
            Duration in seconds
        """
        ffprobe_path = FFmpegUtils.get_ffprobe_path()
        
        cmd = [
            ffprobe_path,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            duration = float(result.stdout.strip())
            return duration
        except Exception as e:
            logger.error(f"Failed to get video duration: {e}")
            return 0.0
