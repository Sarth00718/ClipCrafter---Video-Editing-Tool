"""
FAISS vector index wrapper with metadata sidecar.

Provides create / add / search / save / load operations.
Uses IndexFlatIP (inner-product) which equals cosine similarity when vectors
are L2-normalised (our Embedder does this).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import faiss
import numpy as np

from app.core.config import settings
from app.core.logger import get_logger
from app.models.schemas import ChunkMetadata, TextChunk

logger = get_logger(__name__)


class FAISSIndex:
    """Manages a single FAISS index plus its chunk metadata."""

    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index: faiss.IndexFlatIP = faiss.IndexFlatIP(dimension)
        # Parallel lists — position i in metadata matches vector i in the FAISS index
        self._metadata: list[dict] = []
        self._texts: list[str] = []

    # ────────────────────────── CRUD ───────────────────────────────

    def add_documents(self, chunks: list[TextChunk], embeddings: np.ndarray) -> None:
        """Add chunk embeddings and their metadata to the index.

        Args:
            chunks: TextChunk objects (text + metadata).
            embeddings: (N, D) float32 matrix from the Embedder.
        """
        if len(chunks) != embeddings.shape[0]:
            raise ValueError("Mismatch between chunk count and embedding count.")

        self.index.add(embeddings)
        for chunk in chunks:
            self._metadata.append(chunk.metadata.model_dump())
            self._texts.append(chunk.text)

        logger.info("Added %d vectors — total index size: %d", len(chunks), self.index.ntotal)

    def search_similar(
        self,
        query_vector: np.ndarray,
        top_k: int | None = None,
    ) -> list[dict]:
        """Return the top-k most similar chunks to the query vector.

        Returns:
            List of dicts with keys: text, score, metadata.
        """
        k = min(top_k or settings.top_k, self.index.ntotal)
        if k == 0:
            return []

        query_2d = query_vector.reshape(1, -1).astype(np.float32)
        scores, indices = self.index.search(query_2d, k)

        results: list[dict] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append({
                "text": self._texts[idx],
                "score": float(score),
                "metadata": self._metadata[idx],
            })
        return results

    # ────────────────────────── Persistence ────────────────────────

    def save(self, directory: str | Path) -> None:
        """Persist index and metadata to disk."""
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(path / "index.faiss"))

        sidecar = {
            "dimension": self.dimension,
            "metadata": self._metadata,
            "texts": self._texts,
        }
        (path / "sidecar.json").write_text(json.dumps(sidecar, default=str), encoding="utf-8")

        logger.info("Saved FAISS index (%d vectors) to %s", self.index.ntotal, path)

    @classmethod
    def load(cls, directory: str | Path) -> "FAISSIndex":
        """Load a previously saved index from disk."""
        path = Path(directory)

        index = faiss.read_index(str(path / "index.faiss"))
        sidecar = json.loads((path / "sidecar.json").read_text(encoding="utf-8"))

        instance = cls(dimension=sidecar["dimension"])
        instance.index = index
        instance._metadata = sidecar["metadata"]
        instance._texts = sidecar["texts"]

        logger.info("Loaded FAISS index (%d vectors) from %s", index.ntotal, path)
        return instance

    # ────────────────────────── Helpers ────────────────────────────

    @property
    def size(self) -> int:
        """Number of vectors currently in the index."""
        return self.index.ntotal

    def get_all_texts(self) -> list[str]:
        """Return all stored chunk texts (useful for deduplication)."""
        return list(self._texts)

    def get_all_metadata(self) -> list[dict]:
        """Return all stored metadata entries."""
        return list(self._metadata)
