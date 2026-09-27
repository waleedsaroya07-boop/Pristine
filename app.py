from __future__ import annotations

from pathlib import Path
import uuid

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from knowledge_base import knowledge_index, search_knowledge
from pristine_bot import ConversationState, respond

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title='Pristine Apparel Wholesale Assistant', version='1.2.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'],
)
app.mount('/static', StaticFiles(directory=BASE_DIR / 'static'), name='static')
SESSIONS: dict[str, ConversationState] = {}


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)


class KnowledgeCitation(BaseModel):
    title: str
    source_path: str
    scope: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    state: dict
    citations: list[KnowledgeCitation] = []


@app.get('/health')
def health() -> dict:
    return {
        'ok': True,
        'service': 'pristine-apparel-chatbot',
        'version': '1.2.0',
        'knowledge_hub': True,
    }


@app.get('/')
def index():
    return FileResponse(BASE_DIR / 'static' / 'demo.html')


@app.get('/api/knowledge')
def get_knowledge_index() -> dict:
    return knowledge_index()


@app.get('/api/knowledge/search')
def knowledge_search(
    q: str = Query(min_length=1, max_length=500),
    scope: str | None = None,
    top_k: int = Query(default=3, ge=1, le=5),
) -> dict:
    try:
        matches = search_knowledge(query=q, scope=scope, top_k=top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {'query': q, 'scope': scope, 'matches': matches}


@app.post('/api/chat', response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    session_id = payload.session_id or str(uuid.uuid4())
    state = SESSIONS.setdefault(session_id, ConversationState())
    result = respond(payload.message, state)
    return ChatResponse(
        session_id=session_id,
        reply=result['reply'],
        state=state.as_dict(),
        citations=result['citations'],
    )
