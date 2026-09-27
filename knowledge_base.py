from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
import re
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_PATH = BASE_DIR / "knowledge" / "pristine_wholesale.json"
TOKEN_RE = re.compile(r"[a-z0-9]+")
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "can", "do", "does", "for",
    "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
    "the", "to", "we", "what", "when", "where", "which", "with", "you", "your"
}
VALID_SCOPES = {"general", "teamwear", "workwear", "private_label", "process", "compliance", "trade"}


def _normalise(text: str) -> str:
    return " ".join(TOKEN_RE.findall((text or "").lower()))


def _tokens(text: str) -> set[str]:
    return {token for token in TOKEN_RE.findall((text or "").lower()) if token not in STOPWORDS and len(token) > 1}


@lru_cache(maxsize=1)
def load_knowledge() -> tuple[dict[str, Any], ...]:
    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as handle:
        entries = json.load(handle)
    return tuple(entries)


def knowledge_index() -> dict[str, Any]:
    entries = load_knowledge()
    return {
        "scopes": sorted(VALID_SCOPES),
        "entries": [
            {
                "id": entry["id"],
                "scope": entry["scope"],
                "title": entry["title"],
                "source_title": entry["source_title"],
                "source_path": entry["source_path"],
            }
            for entry in entries
        ],
    }


def _score(query: str, entry: dict[str, Any]) -> int:
    query_norm = _normalise(query)
    query_tokens = _tokens(query)
    if not query_tokens:
        return 0

    title_norm = _normalise(entry["title"])
    answer_norm = _normalise(entry["answer"])
    keyword_text = " ".join(entry.get("keywords", []))
    keyword_norm = _normalise(keyword_text)
    title_tokens = _tokens(entry["title"])
    answer_tokens = _tokens(entry["answer"])
    keyword_tokens = _tokens(keyword_text)

    score = 0
    score += 8 * len(query_tokens & keyword_tokens)
    score += 5 * len(query_tokens & title_tokens)
    score += 2 * len(query_tokens & answer_tokens)

    for phrase in entry.get("keywords", []):
        phrase_norm = _normalise(phrase)
        if phrase_norm and phrase_norm in query_norm:
            score += 14

    if query_norm and query_norm in title_norm:
        score += 10
    if query_norm and query_norm in keyword_norm:
        score += 8

    return score


def search_knowledge(query: str, scope: str | None = None, top_k: int = 3) -> list[dict[str, Any]]:
    if not query or not query.strip():
        return []
    if scope is not None and scope not in VALID_SCOPES:
        raise ValueError(f"Unknown knowledge scope: {scope}")
    top_k = max(1, min(int(top_k), 5))

    ranked = []
    for entry in load_knowledge():
        if scope and entry["scope"] not in {scope, "general"}:
            continue
        score = _score(query, entry)
        if score > 0:
            ranked.append((score, entry))

    ranked.sort(key=lambda item: (-item[0], item[1]["title"]))
    return [
        {
            "score": score,
            "id": entry["id"],
            "scope": entry["scope"],
            "title": entry["title"],
            "answer": entry["answer"],
            "source_title": entry["source_title"],
            "source_path": entry["source_path"],
        }
        for score, entry in ranked[:top_k]
    ]


def answer_knowledge(query: str, scope: str | None = None) -> dict[str, Any] | None:
    matches = search_knowledge(query=query, scope=scope, top_k=3)
    if not matches or matches[0]["score"] < 8:
        return None

    best = matches[0]
    threshold = max(8, int(best["score"] * 0.55))
    supporting = [match for match in matches if match["score"] >= threshold]
    citations = []
    seen = set()
    for match in supporting:
        key = (match["source_title"], match["source_path"])
        if key in seen:
            continue
        seen.add(key)
        citations.append(
            {
                "title": match["source_title"],
                "source_path": match["source_path"],
                "scope": match["scope"],
            }
        )

    return {
        "answer": best["answer"],
        "citations": citations,
        "knowledge_id": best["id"],
        "score": best["score"],
    }
