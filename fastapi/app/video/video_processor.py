"""
Video Processing Service for Frame Extraction and Video Reconstruction.
Handles video upload, frame extraction, scene detection, and video rebuilding.
"""

import os
import subprocess
import json
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime

from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class VideoProcessorService:
    """Service for processing videos: extract frames, detect scenes, rebuild video."""
    
    @staticmethod
    def _get_ffmpeg_cmd() -> str:
        """Get FFmpeg command (configured, local, or system PATH)."""
        return settings.ffmpeg_executable
    
    @staticmethod
    def _get_ffprobe_cmd() -> str:
        """Get FFprobe command (configured, local, or system PATH)."""
        return settings.ffprobe_executable
    
    @staticmethod
    def extract_frames(video_path: str, output_dir: str, fps: Optional[int] = None) -> Dict:
        """
        Extract all frames from video using FFmpeg.
        
        Args:
            video_path: Path to input video
            output_dir: Directory to save frames
            fps: Optional FPS for frame extraction (None = extract all frames)
            
        Returns:
            Dict with frame count, fps, duration, resolution
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Get video metadata
        metadata = VideoProcessorService.get_video_metadata(video_path)
        
        # Build FFmpeg command
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-i", video_path,
        ]
        
        if fps:
            cmd.extend(["-vf", f"fps={fps}"])
        
        cmd.extend([
            os.path.join(output_dir, "frame_%05d.png")
        ])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Count extracted frames
            frame_files = sorted([f for f in os.listdir(output_dir) if f.endswith('.png')])
            frame_count = len(frame_files)
            
            logger.info(f"Extracted {frame_count} frames from {video_path}")
            
            return {
                "frame_count": frame_count,
                "fps": metadata["fps"],
                "duration": metadata["duration"],
                "resolution": metadata["resolution"],
                "output_dir": output_dir,
                "frame_files": frame_files
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg frame extraction failed: {e.stderr}")
            raise Exception(f"Frame extraction failed: {e.stderr}")
    
    @staticmethod
    def get_video_metadata(video_path: str) -> Dict:
        """Extract video metadata using FFprobe."""
        ffprobe_cmd = VideoProcessorService._get_ffprobe_cmd()
        cmd = [
            ffprobe_cmd,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            # Find video stream
            video_stream = next(
                (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
                None
            )
            
            if not video_stream:
                raise Exception("No video stream found")
            
            # Extract FPS
            fps_str = video_stream.get("r_frame_rate", "30/1")
            num, den = map(int, fps_str.split('/'))
            fps = num / den if den != 0 else 30
            
            return {
                "duration": float(data.get("format", {}).get("duration", 0)),
                "fps": fps,
                "resolution": f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}",
                "width": video_stream.get("width", 0),
                "height": video_stream.get("height", 0),
                "codec": video_stream.get("codec_name", "unknown"),
                "bitrate": int(data.get("format", {}).get("bit_rate", 0))
            }
            
        except Exception as e:
            logger.error(f"Failed to get video metadata: {e}")
            raise
    
    @staticmethod
    def detect_scenes(video_path: str, threshold: float = 30.0) -> List[Dict]:
        """
        Detect scene changes in video using FFmpeg scene detection.
        
        Args:
            video_path: Path to video file
            threshold: Scene change threshold (0-100, default 30)
            
        Returns:
            List of scene timestamps
        """
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-i", video_path,
            "-vf", f"select='gt(scene,{threshold/100})',showinfo",
            "-f", "null",
            "-"
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                stderr=subprocess.STDOUT
            )
            
            # Parse scene timestamps from FFmpeg output
            scenes = []
            for line in result.stdout.split('\n'):
                if 'Parsed_showinfo' in line and 'pts_time' in line:
                    try:
                        # Extract timestamp
                        pts_time = line.split('pts_time:')[1].split()[0]
                        scenes.append({
                            "timestamp": float(pts_time),
                            "frame": len(scenes)
                        })
                    except:
                        continue
            
            logger.info(f"Detected {len(scenes)} scene changes")
            return scenes
            
        except Exception as e:
            logger.error(f"Scene detection failed: {e}")
            return []
    
    @staticmethod
    def extract_audio(video_path: str, output_path: str) -> str:
        """Extract audio from video."""
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-i", video_path,
            "-vn",  # No video
            "-acodec", "libmp3lame",
            "-q:a", "2",  # High quality
            "-y",  # Overwrite
            output_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Extracted audio to {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Audio extraction failed: {e.stderr}")
            raise Exception(f"Audio extraction failed: {e.stderr}")
    
    @staticmethod
    def frames_to_video(
        frames_dir: str,
        output_path: str,
        fps: int = 30,
        audio_path: Optional[str] = None,
        codec: str = "libx264"
    ) -> str:
        """
        Convert frames back to video.
        
        Args:
            frames_dir: Directory containing frames (frame_00001.png, etc.)
            output_path: Output video path
            fps: Frames per second
            audio_path: Optional audio file to merge
            codec: Video codec (default: libx264)
            
        Returns:
            Path to output video
        """
        # Build FFmpeg command
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-framerate", str(fps),
            "-i", os.path.join(frames_dir, "frame_%05d.png"),
            "-c:v", codec,
            "-pix_fmt", "yuv420p",
        ]
        
        # Add audio if provided
        if audio_path and os.path.exists(audio_path):
            cmd.extend([
                "-i", audio_path,
                "-c:a", "aac",
                "-shortest"  # Match shortest stream
            ])
        
        cmd.extend([
            "-y",  # Overwrite
            output_path
        ])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"Created video: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Video creation failed: {e.stderr}")
            raise Exception(f"Video creation failed: {e.stderr}")
    
    @staticmethod
    def split_video_by_scenes(
        video_path: str,
        scenes: List[Dict],
        output_dir: str
    ) -> List[str]:
        """
        Split video into clips based on scene timestamps.
        
        Args:
            video_path: Input video path
            scenes: List of scene dicts with 'timestamp' key
            output_dir: Directory to save clips
            
        Returns:
            List of clip file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        clip_paths = []
        
        # Add start and end timestamps
        timestamps = [0.0] + [s["timestamp"] for s in scenes]
        metadata = VideoProcessorService.get_video_metadata(video_path)
        timestamps.append(metadata["duration"])
        
        for i in range(len(timestamps) - 1):
            start = timestamps[i]
            duration = timestamps[i + 1] - start
            
            clip_path = os.path.join(output_dir, f"scene_{i:03d}.mp4")
            
            ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
            cmd = [
                ffmpeg_cmd,
                "-i", video_path,
                "-ss", str(start),
                "-t", str(duration),
                "-c", "copy",
                "-y",
                clip_path
            ]
            
            try:
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                clip_paths.append(clip_path)
                logger.info(f"Created clip {i}: {start:.2f}s - {start+duration:.2f}s")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to create clip {i}: {e.stderr}")
        
        return clip_paths
    
    @staticmethod
    def merge_videos(video_paths: List[str], output_path: str) -> str:
        """
        Merge multiple video clips into one.
        
        Args:
            video_paths: List of video file paths to merge
            output_path: Output video path
            
        Returns:
            Path to merged video
        """
        # Create concat file
        concat_file = output_path + ".concat.txt"
        
        with open(concat_file, 'w') as f:
            for path in video_paths:
                f.write(f"file '{os.path.abspath(path)}'\n")
        
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            "-y",
            output_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info(f"Merged {len(video_paths)} videos into {output_path}")
            
            # Cleanup concat file
            os.remove(concat_file)
            
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Video merge failed: {e.stderr}")
            if os.path.exists(concat_file):
                os.remove(concat_file)
            raise Exception(f"Video merge failed: {e.stderr}")
    
    @staticmethod
    def replace_frame(frames_dir: str, frame_number: int, new_frame_path: str) -> bool:
        """
        Replace a specific frame in the frames directory.
        
        Args:
            frames_dir: Directory containing frames
            frame_number: Frame number to replace (1-indexed)
            new_frame_path: Path to new frame image
            
        Returns:
            True if successful
        """
        target_frame = os.path.join(frames_dir, f"frame_{frame_number:05d}.png")
        
        try:
            shutil.copy2(new_frame_path, target_frame)
            logger.info(f"Replaced frame {frame_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to replace frame {frame_number}: {e}")
            return False
    
    @staticmethod
    def get_frame_at_timestamp(video_path: str, timestamp: float, output_path: str) -> str:
        """Extract a single frame at specific timestamp."""
        ffmpeg_cmd = VideoProcessorService._get_ffmpeg_cmd()
        cmd = [
            ffmpeg_cmd,
            "-ss", str(timestamp),
            "-i", video_path,
            "-frames:v", "1",
            "-y",
            output_path
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Frame extraction failed: {e.stderr}")
            raise Exception(f"Frame extraction failed: {e.stderr}")
