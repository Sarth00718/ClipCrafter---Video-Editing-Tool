"""
FastAPI application entry point for the RAG Video Script Generator.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as doc_router
from app.api.video_routes import router as video_router
from app.api.video_upload_routes import router as video_upload_router
from app.api.enhancement_routes import router as enhancement_router
from app.core.config import settings
from app.core.logger import get_logger
from app.utils.ffmpeg_utils import FFmpegUtils

logger = get_logger(__name__)

_FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # ── Startup ────────────────────────────────────────────────────
    logger.info("Starting RAG Video Script Generator…")

    # Ensure all storage directories exist
    for dir_attr in ("upload_dir", "index_dir", "parsed_dir", "scripts_dir", "projects_dir"):
        settings.resolve_path(getattr(settings, dir_attr))
    logger.info("Storage directories ready")
    
    # Check FFmpeg availability
    ffmpeg_available, ffmpeg_msg = FFmpegUtils.check_ffmpeg_available()
    if ffmpeg_available:
        logger.info(ffmpeg_msg)
    else:
        logger.warning(f"FFmpeg check: {ffmpeg_msg}")
        logger.warning("Video processing features may be limited without FFmpeg")

    yield

    # ── Shutdown ───────────────────────────────────────────────────
    logger.info("Shutting down RAG Video Script Generator.")


app = FastAPI(
    title="RAG Video Script Generator",
    description=(
        "Upload a document (PDF, DOCX, PPTX, TXT) and generate a structured, "
        "narration-ready educational video script powered by RAG + Groq LLM."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/assets",
    StaticFiles(directory=settings.resolve_path(settings.projects_dir)),
    name="assets",
)

# ── Mount routes ──────────────────────────────────────────────────
app.include_router(doc_router)
app.include_router(video_router)
app.include_router(video_upload_router)
app.include_router(enhancement_router)


# ── Root redirect to UI ──────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/ui/index.html")


# ── Serve frontend static files ──────────────────────────────────
app.mount("/ui", StaticFiles(directory=str(_FRONTEND_DIR)), name="frontend")