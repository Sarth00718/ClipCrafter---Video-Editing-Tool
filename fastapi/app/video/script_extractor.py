"""
Script Extraction Service for extracting text/speech from videos.
Uses Whisper API or speech recognition to transcribe audio.
"""

import os
import subprocess
from typing import Dict, List, Optional
import json

from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class ScriptExtractorService:
    """Service for extracting scripts/transcripts from video audio."""
    
    @staticmethod
    async def extract_script_from_video(
        video_path: str,
        language: str = "en",
        model: str = "base"
    ) -> Dict:
        """
        Extract script/transcript from video using Whisper or similar.
        
        Args:
            video_path: Path to video file
            language: Language code (default: en)
            model: Whisper model size (tiny, base, small, medium, large)
            
        Returns:
            Dict with transcript, segments, and metadata
        """
        try:
            # First extract audio from video
            audio_path = video_path.replace('.mp4', '_audio.mp3')
            ScriptExtractorService._extract_audio(video_path, audio_path)
            
            # Try using Whisper if available
            try:
                import whisper
                result = ScriptExtractorService._transcribe_with_whisper(
                    audio_path, language, model
                )
            except ImportError:
                logger.warning("Whisper not available, using fallback method")
                result = ScriptExtractorService._transcribe_fallback(audio_path)
            
            # Cleanup temp audio
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            return result
            
        except Exception as e:
            logger.error(f"Script extraction failed: {e}")
            raise Exception(f"Script extraction failed: {str(e)}")
    
    @staticmethod
    def _extract_audio(video_path: str, audio_path: str):
        """Extract audio from video using FFmpeg."""
        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vn",
            "-acodec", "libmp3lame",
            "-q:a", "2",
            "-y",
            audio_path
        ]
        
        subprocess.run(cmd, capture_output=True, text=True, check=True)
    
    @staticmethod
    def _transcribe_with_whisper(
        audio_path: str,
        language: str,
        model: str
    ) -> Dict:
        """Transcribe audio using OpenAI Whisper."""
        try:
            import whisper
        except ImportError:
            raise ImportError(
                "Whisper is not installed. Install with: pip install openai-whisper"
            )
        
        logger.info(f"Loading Whisper model: {model}")
        model_obj = whisper.load_model(model)
        
        logger.info(f"Transcribing audio: {audio_path}")
        result = model_obj.transcribe(
            audio_path,
            language=language,
            verbose=False
        )
        
        # Format segments
        segments = []
        for seg in result.get("segments", []):
            segments.append({
                "id": seg["id"],
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "duration": seg["end"] - seg["start"]
            })
        
        return {
            "text": result["text"].strip(),
            "language": result.get("language", language),
            "segments": segments,
            "method": "whisper",
            "model": model
        }
    
    @staticmethod
    def _transcribe_fallback(audio_path: str) -> Dict:
        """
        Fallback transcription method using speech_recognition library.
        Less accurate but doesn't require Whisper installation.
        """
        try:
            import speech_recognition as sr
        except ImportError:
            logger.error("speech_recognition library not installed")
            return {
                "text": "",
                "language": "en",
                "segments": [],
                "method": "none",
                "error": "No transcription library available. Install openai-whisper or SpeechRecognition"
            }
        
        try:
            recognizer = sr.Recognizer()
            
            # Convert to WAV for speech_recognition
            wav_path = audio_path.replace('.mp3', '.wav')
            cmd = [
                "ffmpeg",
                "-i", audio_path,
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                "-y",
                wav_path
            ]
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Transcribe
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
            
            # Cleanup
            if os.path.exists(wav_path):
                os.remove(wav_path)
            
            return {
                "text": text,
                "language": "en",
                "segments": [{
                    "id": 0,
                    "start": 0,
                    "end": 0,
                    "text": text,
                    "duration": 0
                }],
                "method": "speech_recognition"
            }
            
        except Exception as e:
            logger.error(f"Fallback transcription failed: {e}")
            # Return empty transcript if all methods fail
            return {
                "text": "",
                "language": "en",
                "segments": [],
                "method": "none",
                "error": str(e)
            }
    
    @staticmethod
    def segment_script_by_scenes(
        transcript: Dict,
        scene_timestamps: List[float]
    ) -> List[Dict]:
        """
        Divide transcript into segments based on scene timestamps.
        
        Args:
            transcript: Transcript dict with segments
            scene_timestamps: List of scene change timestamps
            
        Returns:
            List of script segments aligned with scenes
        """
        segments = transcript.get("segments", [])
        if not segments:
            return []
        
        # Add start and end boundaries
        boundaries = [0.0] + scene_timestamps + [segments[-1]["end"]]
        
        scene_scripts = []
        
        for i in range(len(boundaries) - 1):
            start_time = boundaries[i]
            end_time = boundaries[i + 1]
            
            # Find segments within this time range
            scene_text = []
            for seg in segments:
                seg_start = seg["start"]
                seg_end = seg["end"]
                
                # Check if segment overlaps with scene
                if seg_start < end_time and seg_end > start_time:
                    scene_text.append(seg["text"])
            
            scene_scripts.append({
                "scene_id": f"scene_{i:03d}",
                "start": start_time,
                "end": end_time,
                "duration": end_time - start_time,
                "text": " ".join(scene_text).strip()
            })
        
        return scene_scripts
    
    @staticmethod
    def generate_srt_subtitles(transcript: Dict, output_path: str) -> str:
        """Generate SRT subtitle file from transcript."""
        segments = transcript.get("segments", [])
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, seg in enumerate(segments, 1):
                start = ScriptExtractorService._format_timestamp(seg["start"])
                end = ScriptExtractorService._format_timestamp(seg["end"])
                
                f.write(f"{i}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{seg['text']}\n\n")
        
        logger.info(f"Generated SRT subtitles: {output_path}")
        return output_path
    
    @staticmethod
    def _format_timestamp(seconds: float) -> str:
        """Format seconds to SRT timestamp format (HH:MM:SS,mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
