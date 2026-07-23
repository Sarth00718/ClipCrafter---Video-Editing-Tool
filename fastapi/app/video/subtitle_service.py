"""
Subtitle generation service using Whisper for speech-to-text.
Generates SRT subtitle files from audio.
"""

import os
from typing import Optional, List
from datetime import timedelta
from app.core.logger import get_logger

logger = get_logger(__name__)


class SubtitleService:
    """Generate subtitles from audio using Whisper."""
    
    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """
        Convert seconds to SRT timestamp format (HH:MM:SS,mmm).
        
        Args:
            seconds: Time in seconds
            
        Returns:
            Formatted timestamp string
        """
        td = timedelta(seconds=seconds)
        hours = int(td.total_seconds() // 3600)
        minutes = int((td.total_seconds() % 3600) // 60)
        secs = int(td.total_seconds() % 60)
        millis = int((td.total_seconds() % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    @staticmethod
    def generate_srt_from_text(
        text: str,
        duration: float,
        output_path: str,
        words_per_subtitle: int = 10
    ) -> str:
        """
        Generate SRT subtitle file from text and duration.
        Splits text into chunks and distributes evenly across duration.
        
        Args:
            text: Full text to convert to subtitles
            duration: Total duration in seconds
            output_path: Path to save SRT file
            words_per_subtitle: Number of words per subtitle segment
            
        Returns:
            Path to generated SRT file
        """
        words = text.split()
        
        if not words:
            raise ValueError("Text is empty, cannot generate subtitles")
        
        # Split into chunks
        chunks = []
        for i in range(0, len(words), words_per_subtitle):
            chunk = " ".join(words[i:i + words_per_subtitle])
            chunks.append(chunk)
        
        # Calculate timing for each chunk
        time_per_chunk = duration / len(chunks)
        
        # Generate SRT content
        srt_lines = []
        for idx, chunk in enumerate(chunks, start=1):
            start_time = idx * time_per_chunk - time_per_chunk
            end_time = idx * time_per_chunk
            
            srt_lines.append(str(idx))
            srt_lines.append(
                f"{SubtitleService.format_timestamp(start_time)} --> "
                f"{SubtitleService.format_timestamp(end_time)}"
            )
            srt_lines.append(chunk)
            srt_lines.append("")  # Empty line between entries
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(srt_lines))
        
        logger.info(f"Generated SRT subtitle file: {output_path} ({len(chunks)} segments)")
        return output_path
    
    @staticmethod
    def generate_srt_from_audio_whisper(
        audio_path: str,
        output_path: str,
        model_size: str = "small"
    ) -> str:
        """
        Generate SRT subtitle file from audio using Whisper.
        
        Args:
            audio_path: Path to audio file
            output_path: Path to save SRT file
            model_size: Whisper model size (tiny, base, small, medium, large)
            
        Returns:
            Path to generated SRT file
        """
        try:
            import whisper
            
            logger.info(f"Loading Whisper model: {model_size}")
            model = whisper.load_model(model_size)
            
            logger.info(f"Transcribing audio: {audio_path}")
            result = model.transcribe(audio_path, word_timestamps=True)
            
            # Generate SRT from segments
            srt_lines = []
            for idx, segment in enumerate(result['segments'], start=1):
                start_time = segment['start']
                end_time = segment['end']
                text = segment['text'].strip()
                
                srt_lines.append(str(idx))
                srt_lines.append(
                    f"{SubtitleService.format_timestamp(start_time)} --> "
                    f"{SubtitleService.format_timestamp(end_time)}"
                )
                srt_lines.append(text)
                srt_lines.append("")
            
            # Write to file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("\n".join(srt_lines))
            
            logger.info(f"Generated Whisper SRT subtitle file: {output_path}")
            return output_path
            
        except ImportError:
            logger.warning("Whisper not installed, falling back to text-based subtitles")
            raise RuntimeError(
                "Whisper is not installed. Install with: pip install openai-whisper"
            )
        except Exception as e:
            logger.error(f"Whisper subtitle generation failed: {e}")
            raise RuntimeError(f"Subtitle generation failed: {e}")
    
    @staticmethod
    def generate_subtitles_for_scene(
        narration_text: str,
        audio_path: str,
        duration: float,
        output_path: str,
        use_whisper: bool = False
    ) -> str:
        """
        Generate subtitles for a scene.
        
        Args:
            narration_text: Scene narration text
            audio_path: Path to scene audio file
            duration: Scene duration in seconds
            output_path: Path to save SRT file
            use_whisper: Whether to use Whisper (slower but more accurate)
            
        Returns:
            Path to generated SRT file
        """
        if use_whisper and os.path.exists(audio_path):
            try:
                return SubtitleService.generate_srt_from_audio_whisper(
                    audio_path, output_path
                )
            except Exception as e:
                logger.warning(f"Whisper failed, falling back to text-based: {e}")
        
        # Fallback to text-based subtitles
        return SubtitleService.generate_srt_from_text(
            narration_text, duration, output_path
        )
