import os
import httpx
from typing import Optional

# We use edge-tts for high-quality, free async text-to-speech
import edge_tts
from moviepy import AudioFileClip

from app.core.config import settings
from app.core.logger import get_logger
from enum import Enum
from google import genai
from google.genai import types

logger = get_logger(__name__)


class AudioGenerationService:
    """Generates TTS audio files using edge-tts and computes their exact duration."""

    @staticmethod
    async def generate_audio(text: str, output_path: str, voice: str = "en-US-AriaNeural") -> Optional[float]:
        """
        Generate MP3 audio from text.
        Returns the exact duration of the generated audio in seconds.
        """
        try:
            logger.info(f"Generating TTS audio with voice {voice}...")
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)

            if os.path.exists(output_path):
                with AudioFileClip(output_path) as audio_clip:
                    duration = audio_clip.duration
                return duration
            return None

        except Exception as e:
            logger.error(f"Failed to generate audio: {e}")
            raise RuntimeError(f"Audio generation failed: {e}")


class ImageProvider(str, Enum):
    POLLINATIONS = "pollinations"
    GEMINI = "gemini"
    STABILITY = "stabilityai"


class ImageGenerationService:
    """
    Generates images using AI providers, acting as an abstraction layer for styles,
    educational prompt enrichment, and negative prompts.
    """

    STYLE_PRESETS = {
        "ghibli_studio": (
            "Studio Ghibli inspired educational illustration, warm hand-painted aesthetic, "
            "soft cinematic lighting, expressive but scientifically meaningful, visually rich, "
            "storybook quality, clean composition"
        ),
        "ghibli_educational": (
            "Studio Ghibli inspired educational scientific illustration, warm painterly textures, "
            "soft natural colors, magical but clear and instructional, child-friendly yet accurate"
        ),
        "textbook_diagram": (
            "clean textbook-style scientific diagram, highly legible educational composition, "
            "structured layout, clear focus on concept explanation, minimal background clutter"
        ),
        "scientific_infographic": (
            "scientific infographic style, explanatory layout, educational visual hierarchy, "
            "clean labels, concept-first composition, highly informative"
        ),
        "cinematic_educational": (
            "cinematic educational illustration, high detail, visually engaging, dramatic but accurate, "
            "clear teaching composition, concept-focused"
        ),
        "minimalist_biology": (
            "minimalist biology educational illustration, simple clean layout, uncluttered, "
            "focused on plant biology structures and processes"
        ),
        "storybook_science": (
            "friendly storybook science illustration, visually engaging for students, warm colors, "
            "educational but imaginative"
        ),
    }

    DEFAULT_NEGATIVE_PROMPT = (
        "blurry, low detail, low resolution, distorted anatomy, bad composition, generic wallpaper, "
        "random decorative art, irrelevant objects, unreadable labels, messy layout, extra objects, "
        "oversaturated, low educational value, poor scientific accuracy, abstract without explanation, "
        "text artifacts, watermark, logo, deformed plant structures, cropped subject"
    )

    @staticmethod
    def _normalize_style(style_preset: str) -> str:
        if not style_preset:
            return "cinematic_educational"
        return style_preset.strip().lower().replace(" ", "_")

    @staticmethod
    def _get_style_description(style_preset: str) -> str:
        normalized = ImageGenerationService._normalize_style(style_preset)
        return ImageGenerationService.STYLE_PRESETS.get(
            normalized,
            ImageGenerationService.STYLE_PRESETS["cinematic_educational"]
        )

    @staticmethod
    def _detect_domain_details(prompt: str) -> str:
        """
        Adds domain-aware educational instructions based on keywords present in the prompt.
        """
        p = prompt.lower()

        details = []

        if any(word in p for word in ["photosynthesis", "chloroplast", "chlorophyll", "plant cell", "leaf"]):
            details.append(
                "Focus on plant biology. Show the concept in an educational way using visible biological structures. "
                "If relevant, include chloroplasts, leaf tissue, plant cells, sunlight rays, and arrows showing energy or material flow."
            )

        if "chloroplast" in p or "chlorophyll" in p:
            details.append(
                "Show the inside of a plant cell or a clear close-up of chloroplast structures. "
                "If the concept involves absorption of sunlight, depict sunlight rays entering and being absorbed. "
                "Use process arrows and explanatory visual relationships."
            )

        if "sunlight" in p or "light energy" in p or "solar energy" in p:
            details.append(
                "Show sunlight rays clearly interacting with the biological subject. "
                "Depict the direction of light and how the light energy reaches the leaf or chloroplast. "
                "Use visual flow cues instead of symbolic icons only."
            )

        if any(word in p for word in ["process", "flow", "convert", "absorb", "reaction", "transform", "produce"]):
            details.append(
                "The image must explain a process, not just show objects. "
                "Use arrows, cause-and-effect composition, inputs and outputs, and a layout that teaches the transformation."
            )

        if any(word in p for word in ["glucose", "oxygen", "carbon dioxide", "water"]):
            details.append(
                "If relevant, visually include inputs and outputs of the process: carbon dioxide and water entering, glucose and oxygen leaving."
            )

        # AI and Machine Learning Domain
        if any(word in p for word in ["artificial intelligence", "ai", "machine learning", "neural network", "transformer", "llm"]):
            details.append(
                "Show stylized glowing neural networks, digital brain connections, or data flow visualizations. "
                "The aesthetic should be futuristic and tech-focused, showing the 'inside' of an AI system or interconnected data nodes. "
                "Keep it educational and clean, not just abstract noise."
            )

        if "education" in p or "learning" in p or "student" in p or "teacher" in p:
            details.append(
                "Integrate educational elements: a student interacting with digital interfaces, a futuristic classroom, "
                "or a visualization of knowledge being shared or synthesized. "
                "Focus on the intersection of human learning and technology."
            )

        if any(word in p for word in ["split-screen", "comparison", "compare", "versus", "vs"]):
            details.append(
                "Use a clear vertical split-screen composition to compare two states or concepts side-by-side. "
                "Ensure both sides are visually distinct and labeled if possible."
            )

        if not details:
            details.append(
                "Create an educational explanatory image with strong concept clarity, showing structure, mechanism, and meaningful relationships instead of generic decorative visuals."
            )

        return " ".join(details)

    @staticmethod
    def _build_high_quality_prompt(
        prompt: str,
        style_preset: str = "cinematic_educational",
        negative_prompt: Optional[str] = None,
        provider: str = "generic"
    ) -> tuple[str, str]:
        """
        Build a richer educational image prompt and a robust negative prompt.
        The prompt must stay grounded in the specific concept described.
        """
        # Ensure we have valid inputs
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        # Ensure style_preset is not None
        if not style_preset:
            style_preset = "cinematic_educational"
            
        style_description = ImageGenerationService._get_style_description(style_preset)
        domain_details = ImageGenerationService._detect_domain_details(prompt)

        positive_prompt = (
            "IMPORTANT: Generate an image that DIRECTLY illustrates the specific concept below. "
            "Do NOT create generic or decorative art. The image must be relevant to the exact topic described. "
            f"Primary concept to illustrate: {prompt}. "
            f"{domain_details} "
            "Use a well-structured composition with the main subject centered and clearly visible. "
            "If the concept describes a process, visually show the process step or mechanism. "
            "If the concept describes a structure, show the structure with clarity. "
            "Make the image visually intuitive for students and useful in an educational explainer video. "
            "Add process arrows or flow indicators when relevant to the concept. "
            f"Style direction: {style_description}. "
            "Image quality: highly detailed, sharp focus, professional educational illustration, "
            "clean background, strong subject separation, excellent composition."
        )

        final_negative_prompt = (
            f"{ImageGenerationService.DEFAULT_NEGATIVE_PROMPT}, unrelated subject matter, "
            f"off-topic visuals, random generic scene"
        )
        if negative_prompt:
            final_negative_prompt += f", {negative_prompt}"

        logger.info(f"Built enhanced prompt for {provider}: {positive_prompt[:200]}...")
        logger.info(f"Built negative prompt for {provider}: {final_negative_prompt[:160]}...")

        return positive_prompt, final_negative_prompt

    @staticmethod
    async def generate_image(
        prompt: str,
        output_path: str,
        style_preset: str = "cinematic_educational",
        negative_prompt: Optional[str] = None,
        provider: str = ImageProvider.POLLINATIONS.value,
        scene_number: Optional[int] = None,
        scene_id: Optional[str] = None
    ) -> str:
        """
        Produce an image from a prompt using Pollinations, Gemini, or Stability.ai.
        Saves to output_path and returns the path on success.
        
        Priority:
        1. Try Pollinations (free, no API key required)
        2. If fails, try Stability.ai
        3. If fails, try Gemini
        4. If all fail, raise detailed error
        
        Args:
            prompt: The image generation prompt
            output_path: Where to save the generated image
            style_preset: Visual style preset
            negative_prompt: What to avoid in the image
            provider: Preferred provider (pollinations, stabilityai, gemini)
            scene_number: Scene number for uniqueness
            scene_id: Scene ID for uniqueness
        """
        # Validate inputs
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty for image generation")
        
        if not style_preset:
            style_preset = "cinematic_educational"
            logger.warning("style_preset was None, defaulting to 'cinematic_educational'")
        
        logger.info(f"Generating image using provider {provider}...")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Determine provider order
        if provider == ImageProvider.POLLINATIONS.value:
            providers_to_try = [ImageProvider.POLLINATIONS.value, ImageProvider.STABILITY.value, ImageProvider.GEMINI.value]
        elif provider == ImageProvider.STABILITY.value:
            providers_to_try = [ImageProvider.STABILITY.value, ImageProvider.POLLINATIONS.value, ImageProvider.GEMINI.value]
        elif provider == ImageProvider.GEMINI.value:
            providers_to_try = [ImageProvider.GEMINI.value, ImageProvider.POLLINATIONS.value, ImageProvider.STABILITY.value]
        else:
            providers_to_try = [ImageProvider.POLLINATIONS.value, ImageProvider.STABILITY.value, ImageProvider.GEMINI.value]
        
        errors = {}
        
        # Try each provider in order
        for current_provider in providers_to_try:
            try:
                logger.info(f"Attempting image generation with provider: {current_provider}")
                
                if current_provider == ImageProvider.POLLINATIONS.value:
                    return await ImageGenerationService.generate_image_with_pollinations(
                        prompt, output_path, style_preset, negative_prompt, scene_number, scene_id
                    )
                elif current_provider == ImageProvider.STABILITY.value:
                    return await ImageGenerationService.generate_image_with_stability(
                        prompt, output_path, style_preset, negative_prompt
                    )
                elif current_provider == ImageProvider.GEMINI.value:
                    return await ImageGenerationService.generate_image_with_gemini(
                        prompt, output_path, style_preset, negative_prompt
                    )
                    
            except Exception as e:
                error_msg = str(e)
                errors[current_provider] = error_msg
                logger.error(f"Provider {current_provider} failed: {error_msg}", exc_info=True)
        
        # All providers failed - raise detailed error
        error_details = "\n".join([f"  {prov}: {err}" for prov, err in errors.items()])
        error_message = (
            f"Image generation failed with all providers.\n\n"
            f"{error_details}\n\n"
            f"Please check:\n"
            f"1. Network connectivity is working\n"
            f"2. API keys are configured correctly in .env file (for Stability/Gemini)\n"
            f"3. API keys have sufficient credits/quota\n"
            f"4. The prompt is valid and not violating content policies\n\n"
            f"Prompt: {prompt[:200]}..."
        )
        
        logger.error(error_message)
        raise RuntimeError(error_message)

    @staticmethod
    async def generate_image_with_pollinations(
        prompt: str,
        output_path: str,
        style_preset: str,
        negative_prompt: Optional[str],
        scene_number: Optional[int] = None,
        scene_id: Optional[str] = None
    ) -> str:
        """
        Pollinations.ai Image Generation (Free, no API key required).
        Uses simple URL-based API: https://image.pollinations.ai/prompt/{prompt}
        Raises exception if generation fails.
        
        Args:
            prompt: The image generation prompt
            output_path: Where to save the image
            style_preset: Visual style preset
            negative_prompt: What to avoid
            scene_number: Scene number for uniqueness
            scene_id: Scene ID for uniqueness
        """
        final_prompt, _ = ImageGenerationService._build_high_quality_prompt(
            prompt=prompt,
            style_preset=style_preset,
            negative_prompt=negative_prompt,
            provider="pollinations"
        )

        # Add scene-specific context to make each image unique
        # This ensures different scenes get different images even with similar prompts
        if scene_number is not None:
            final_prompt = f"Scene {scene_number}: {final_prompt}"
        
        # Add scene ID hash as additional uniqueness factor
        if scene_id:
            # Use last 8 characters of scene_id as a unique identifier
            unique_id = scene_id[-8:] if len(scene_id) >= 8 else scene_id
            final_prompt = f"{final_prompt} [ID:{unique_id}]"

        logger.info(f"Pollinations.ai Prompt (Scene {scene_number}): '{final_prompt[:150]}...'")

        # URL encode the prompt
        import urllib.parse
        encoded_prompt = urllib.parse.quote(final_prompt)
        
        # Pollinations API URL with parameters for better quality
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        
        # Generate a unique seed based on scene_id to ensure different images
        import hashlib
        seed = -1  # Default random seed
        if scene_id:
            # Create a deterministic but unique seed from scene_id
            seed_hash = hashlib.md5(scene_id.encode()).hexdigest()
            seed = int(seed_hash[:8], 16) % 1000000  # Convert to number
        
        # Add quality parameters
        params = {
            "width": "1024",
            "height": "1024",
            "seed": str(seed),  # Unique seed per scene
            "nologo": "true",  # Remove watermark
            "enhance": "true"  # Enable enhancement
        }
        
        # Build full URL with parameters
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{url}?{param_string}"

        try:
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                logger.info(f"Requesting image from Pollinations.ai (seed: {seed})...")
                response = await client.get(full_url)
                
                if response.status_code == 200:
                    # Save the image
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    logger.info(f"Pollinations.ai image saved to {output_path}")
                    return output_path
                else:
                    error_text = response.text[:500] if response.text else "No error message"
                    logger.error(f"Pollinations.ai API Error ({response.status_code}): {error_text}")
                    raise RuntimeError(
                        f"Pollinations.ai API error (HTTP {response.status_code}): {error_text}"
                    )

        except httpx.TimeoutException as e:
            logger.error(f"Pollinations.ai request timed out: {e}")
            raise RuntimeError(
                f"Pollinations.ai request timed out after 60 seconds. "
                f"This may indicate network issues or high API load."
            )
        except RuntimeError:
            raise
        except Exception as e:
            logger.error(f"Pollinations.ai generation failed: {e}", exc_info=True)
            raise RuntimeError(
                f"Pollinations.ai image generation failed: {str(e)}. "
                f"Please check your network connection."
            )

    @staticmethod
    async def generate_image_with_stability(
        prompt: str,
        output_path: str,
        style_preset: str,
        negative_prompt: Optional[str]
    ) -> str:
        """
        Stability.ai Image Generation (Stable Diffusion 3).
        Raises exception if generation fails.
        """
        api_key = settings.stability_api_key
        if not api_key or api_key == "your_stability_api_key_here":
            raise RuntimeError(
                "STABILITY_API_KEY is not configured. "
                "Please add your Stability.ai API key to the .env file. "
                "Get your API key from: https://platform.stability.ai/account/keys"
            )

        final_prompt, final_negative_prompt = ImageGenerationService._build_high_quality_prompt(
            prompt=prompt,
            style_preset=style_preset,
            negative_prompt=negative_prompt,
            provider="stabilityai"
        )

        logger.info(f"Stability.ai Prompt: '{final_prompt[:150]}...'")

        url = settings.stability_api_url

        headers = {
            "authorization": f"Bearer {api_key}",
            "accept": "image/*"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                files = {
                    "prompt": (None, final_prompt),
                    "negative_prompt": (None, final_negative_prompt),
                    "output_format": (None, "jpeg"),
                    "model": (None, "sd3-large-turbo")
                }
                
                response = await client.post(
                    url,
                    headers=headers,
                    files=files,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    logger.info(f"Stability.ai image saved to {output_path}")
                    return output_path
                else:
                    error_text = response.text[:500]
                    logger.error(f"Stability.ai API Error ({response.status_code}): {error_text}")
                    raise RuntimeError(
                        f"Stability.ai API error (HTTP {response.status_code}): {error_text}. "
                        f"This may indicate insufficient credits, invalid API key, or content policy violation."
                    )

        except httpx.TimeoutException as e:
            logger.error(f"Stability.ai request timed out: {e}")
            raise RuntimeError(
                f"Stability.ai request timed out after 60 seconds. "
                f"This may indicate network issues or high API load. "
                f"Original error: {str(e)}"
            )
        except RuntimeError:
            # Re-raise RuntimeError as-is (already formatted)
            raise
        except Exception as e:
            logger.error(f"Stability.ai generation failed: {e}", exc_info=True)
            raise RuntimeError(
                f"Stability.ai image generation failed: {str(e)}. "
                f"Please check your API key, network connection, and API status."
            )

    @staticmethod
    async def generate_image_with_gemini(
        prompt: str,
        output_path: str,
        style_preset: str,
        negative_prompt: Optional[str]
    ) -> str:
        """
        Gemini Imagen image generation.
        Raises exception if generation fails.
        """
        api_key = os.getenv("GEMINI_API_KEY") or settings.gemini_api_key
        if not api_key or api_key == "your_gemini_api_key_here":
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Please add your Gemini API key to the .env file. "
                "Get your API key from: https://makersuite.google.com/app/apikey"
            )

        final_prompt, final_negative_prompt = ImageGenerationService._build_high_quality_prompt(
            prompt=prompt,
            style_preset=style_preset,
            negative_prompt=negative_prompt,
            provider="gemini"
        )

        logger.info(f"Gemini Imagen Prompt: '{final_prompt[:150]}...'")

        try:
            client = genai.Client(api_key=api_key)
            # Try multiple model variations
            models_to_try = [
                "imagen-3.0-generate-001", 
                "imagen-3.0-fast-generate-001",
                "imagen-2.0-generate-002"
            ]
            
            last_error = None
            error_messages = []
            
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting Gemini Imagen with model: {model_name}")
                    result = client.models.generate_images(
                        model=model_name,
                        prompt=final_prompt,
                        config=types.GenerateImagesConfig(
                            number_of_images=1,
                            output_mime_type="image/jpeg",
                            aspect_ratio="1:1"
                        )
                    )

                    for generated_image in result.generated_images:
                        with open(output_path, "wb") as f:
                            f.write(generated_image.image.image_bytes)
                        logger.info(f"Gemini image ({model_name}) saved to {output_path}")
                        return output_path
                        
                except Exception as model_err:
                    error_msg = f"{model_name}: {str(model_err)}"
                    error_messages.append(error_msg)
                    logger.warning(f"Gemini model {model_name} failed: {model_err}")
                    last_error = model_err
                    continue

            # All models failed
            all_errors = "\n  - ".join(error_messages)
            raise RuntimeError(
                f"Gemini Imagen generation failed with all models:\n  - {all_errors}\n\n"
                f"This may indicate:\n"
                f"1. Invalid or expired API key\n"
                f"2. Insufficient quota or credits\n"
                f"3. Content policy violation\n"
                f"4. Network connectivity issues\n"
                f"5. Gemini API service issues"
            )

        except RuntimeError:
            # Re-raise RuntimeError as-is (already formatted)
            raise
        except Exception as e:
            logger.error(f"Gemini Imagen generation failed: {e}", exc_info=True)
            raise RuntimeError(
                f"Gemini Imagen generation failed: {str(e)}. "
                f"Please check your API key, network connection, and API status. "
                f"Get your API key from: https://makersuite.google.com/app/apikey"
            )