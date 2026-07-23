"""
Embedding module — wraps SentenceTransformers for batch text embedding.

Produces normalised vectors suitable for cosine-similarity / inner-product search.
"""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

# Module-level cache so the model is loaded only once per process.
_model_cache: dict[str, SentenceTransformer] = {}


class Embedder:
    """Generate dense embeddings for text chunks."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.embedding_model_name
        self.model = self._load_model(self.model_name)
        self.dimension: int = self.model.get_sentence_embedding_dimension()
        logger.info(
            "Embedder ready — model=%s  dim=%d", self.model_name, self.dimension
        )

    # ────────────────────────── Public API ─────────────────────────

    def embed_texts(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        """Embed a list of strings and return an (N, D) float32 matrix.

        Vectors are L2-normalised so inner-product == cosine similarity.
        """
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        logger.info("Embedding %d texts (batch_size=%d)…", len(texts), batch_size)
        vectors = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return np.asarray(vectors, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query string and return a (D,) vector."""
        vec = self.model.encode(
            [query],
            normalize_embeddings=True,
        )
        return np.asarray(vec, dtype=np.float32).squeeze(0)

    # ────────────────────────── Internal ───────────────────────────

    @staticmethod
    def _load_model(name: str) -> SentenceTransformer:
        if name not in _model_cache:
            logger.info("Loading SentenceTransformer model '%s'…", name)
            _model_cache[name] = SentenceTransformer(name)
        return _model_cache[name]
