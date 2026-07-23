"""
Retriever — query the FAISS index with optional MMR re-ranking,
multi-query expansion, query rewriting, and deduplication.
"""

from __future__ import annotations

import numpy as np
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger
from app.rag.embedder import Embedder
from app.rag.faiss_index import FAISSIndex

logger = get_logger(__name__)


class Retriever:
    """High-level retrieval interface over a FAISSIndex."""

    def __init__(self, index: FAISSIndex, embedder: Embedder):
        self.index = index
        self.embedder = embedder

    # ────────────────────────── Public API ─────────────────────────

    def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        use_mmr: bool = True,
        mmr_lambda: float | None = None,
    ) -> list[dict]:
        """Retrieve the most relevant chunks for a query.

        Args:
            query: User query / goal string.
            top_k: Number of final chunks to return.
            use_mmr: Whether to apply MMR diversity re-ranking.
            mmr_lambda: Trade-off between relevance and diversity (0–1).

        Returns:
            List of dicts with keys: text, score, metadata.
        """
        k = top_k or settings.top_k

        # Fetch more candidates than needed so MMR can diversify
        fetch_k = min(k * 3, self.index.size) if use_mmr else k

        query_vec = self.embedder.embed_query(query)
        candidates = self.index.search_similar(query_vec, top_k=fetch_k)

        if use_mmr and len(candidates) > k:
            candidates = self._mmr_rerank(
                query_vec, candidates, k,
                lam=mmr_lambda or settings.mmr_diversity_lambda,
            )

        # Deduplicate near-identical chunks
        candidates = self._deduplicate(candidates)

        return candidates[:k]

    def multi_query_retrieve(
        self,
        queries: list[str],
        top_k: int | None = None,
        use_mmr: bool = True,
    ) -> list[dict]:
        """Run retrieval for multiple query variants and merge results.

        Useful for multi-query RAG where the original query is rewritten
        into several sub-queries to improve recall.
        """
        seen_ids: set[str] = set()
        merged: list[dict] = []

        for q in queries:
            hits = self.retrieve(q, top_k=top_k, use_mmr=use_mmr)
            for hit in hits:
                chunk_id = hit["metadata"].get("chunk_id", "")
                if chunk_id not in seen_ids:
                    seen_ids.add(chunk_id)
                    merged.append(hit)

        # Sort merged results by score descending
        merged.sort(key=lambda x: x["score"], reverse=True)
        k = top_k or settings.top_k
        return merged[:k]

    # ────────────────────────── MMR ────────────────────────────────

    def _mmr_rerank(
        self,
        query_vec: np.ndarray,
        candidates: list[dict],
        k: int,
        lam: float,
    ) -> list[dict]:
        """Maximal Marginal Relevance re-ranking.

        Balances relevance to the query (lam) against diversity
        among the selected set (1 - lam).
        """
        if not candidates:
            return []

        # Embed all candidate texts for diversity comparison
        texts = [c["text"] for c in candidates]
        cand_vecs = self.embedder.embed_texts(texts)

        selected_indices: list[int] = []
        remaining = list(range(len(candidates)))

        for _ in range(min(k, len(candidates))):
            best_idx = -1
            best_score = -float("inf")

            for idx in remaining:
                # Relevance to query
                relevance = float(np.dot(query_vec, cand_vecs[idx]))

                # Max similarity to already selected
                if selected_indices:
                    sel_vecs = cand_vecs[selected_indices]
                    sim_to_selected = float(np.max(np.dot(sel_vecs, cand_vecs[idx])))
                else:
                    sim_to_selected = 0.0

                mmr_score = lam * relevance - (1 - lam) * sim_to_selected

                if mmr_score > best_score:
                    best_score = mmr_score
                    best_idx = idx

            if best_idx == -1:
                break

            selected_indices.append(best_idx)
            remaining.remove(best_idx)

        return [candidates[i] for i in selected_indices]

    # ────────────────────────── Deduplication ──────────────────────

    @staticmethod
    def _deduplicate(chunks: list[dict], threshold: float = 0.92) -> list[dict]:
        """Remove near-duplicate chunks based on text overlap ratio."""
        if len(chunks) <= 1:
            return chunks

        unique: list[dict] = [chunks[0]]
        for chunk in chunks[1:]:
            is_dup = False
            for u in unique:
                overlap = _text_overlap(chunk["text"], u["text"])
                if overlap > threshold:
                    is_dup = True
                    break
            if not is_dup:
                unique.append(chunk)
        return unique


def _text_overlap(a: str, b: str) -> float:
    """Compute Jaccard-like overlap between two texts (on word level)."""
    set_a = set(a.lower().split())
    set_b = set(b.lower().split())
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)
