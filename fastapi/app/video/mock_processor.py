"""
Mock Video Processor for Development/Testing without FFmpeg.
This allows the app to run without FFmpeg installed.
"""

import os
import json
from typing import Dict, List
from PIL import Image, ImageDraw, ImageFont
import random

from app.core.logger import get_logger

logger = get_logger(__name__)


class MockVideoProcessorService:
    """Mock video processor that works without FFmpeg."""
    
    @staticmethod
    def get_video_metadata(video_path: str) -> Dict:
        """Return mock video metadata."""
        logger.warning("Using MOCK video metadata (FFmpeg not available)")
        
        # Get actual file size
        file_size = os.path.getsize(video_path) if os.path.exists(video_path) else 0
        
        return {
            "duration": 120.0,  # 2 minutes
            "fps": 30.0,
            "resolution": "1920x1080",
            "width": 1920,
            "height": 1080,
            "codec": "h264",
            "bitrate": file_size * 8 // 120 if file_size > 0 else 1000000
        }
    
    @staticmethod
    def extract_frames(video_path: str, output_dir: str, fps: int = None) -> Dict:
        """Generate mock frames (colored rectangles with frame numbers)."""
        logger.warning("Using MOCK frame extraction (FFmpeg not available)")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate 30 mock frames (1 second of video at 30fps)
        frame_count = 30
        
        for i in range(1, frame_count + 1):
            frame_path = os.path.join(output_dir, f"frame_{i:05d}.png")
            
            # Create a colored image with frame number
            img = Image.new('RGB', (640, 360), color=(
                random.randint(50, 200),
                random.randint(50, 200),
                random.randint(50, 200)
            ))
            
            draw = ImageDraw.Draw(img)
            
            # Draw frame number
            text = f"Frame {i}\n(Mock)"
            
            # Calculate text position (center)
            bbox = draw.textbbox((0, 0), text)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            position = ((640 - text_width) // 2, (360 - text_height) // 2)
            
            # Draw text with outline
            for adj_x in [-2, 0, 2]:
                for adj_y in [-2, 0, 2]:
                    draw.text((position[0] + adj_x, position[1] + adj_y), text, fill='black')
            draw.text(position, text, fill='white')
            
            img.save(frame_path)
        
        logger.info(f"Generated {frame_count} mock frames")
        
        return {
            "frame_count": frame_count,
            "fps": 30.0,
            "duration": 1.0,
            "resolution": "640x360",
            "output_dir": output_dir,
            "frame_files": [f"frame_{i:05d}.png" for i in range(1, frame_count + 1)]
        }
    
    @staticmethod
    def detect_scenes(video_path: str, threshold: float = 30.0) -> List[Dict]:
        """Return mock scene detection results."""
        logger.warning("Using MOCK scene detection (FFmpeg not available)")
        
        # Generate 3 mock scenes
        scenes = [
            {"timestamp": 0.0, "frame": 0},
            {"timestamp": 40.0, "frame": 1200},
            {"timestamp": 80.0, "frame": 2400}
        ]
        
        logger.info(f"Generated {len(scenes)} mock scenes")
        return scenes
    
    @staticmethod
    def extract_audio(video_path: str, output_path: str) -> str:
        """Create a mock audio file."""
        logger.warning("Using MOCK audio extraction (FFmpeg not available)")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create empty file
        with open(output_path, 'wb') as f:
            f.write(b'MOCK_AUDIO_FILE')
        
        return output_path
    
    @staticmethod
    def frames_to_video(
        frames_dir: str,
        output_path: str,
        fps: int = 30,
        audio_path: str = None,
        codec: str = "libx264"
    ) -> str:
        """Create a mock video file."""
        logger.warning("Using MOCK video creation (FFmpeg not available)")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create a mock video file
        with open(output_path, 'wb') as f:
            f.write(b'MOCK_VIDEO_FILE')
        
        logger.info(f"Created mock video: {output_path}")
        return output_path
    
    @staticmethod
    def get_frame_at_timestamp(video_path: str, timestamp: float, output_path: str) -> str:
        """Extract a mock frame at timestamp."""
        logger.warning("Using MOCK frame extraction (FFmpeg not available)")
        
        # Create a colored image
        img = Image.new('RGB', (640, 360), color=(100, 150, 200))
        draw = ImageDraw.Draw(img)
        
        text = f"Frame at {timestamp}s\n(Mock)"
        bbox = draw.textbbox((0, 0), text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((640 - text_width) // 2, (360 - text_height) // 2)
        
        draw.text(position, text, fill='white')
        img.save(output_path)
        
        return output_path
