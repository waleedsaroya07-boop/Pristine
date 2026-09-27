from __future__ import annotations

from pathlib import Path
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from pristine_bot import ConversationState, reply

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title='Pristine Apparel Wholesale Chatbot', version='1.1.0')
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


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    state: dict


@app.get('/health')
def health() -> dict:
    return {'ok': True, 'service': 'pristine-apparel-chatbot', 'version': '1.1.0'}


@app.get('/')
def index():
    return FileResponse(BASE_DIR / 'static' / 'demo.html')


@app.post('/api/chat', response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    session_id = payload.session_id or str(uuid.uuid4())
    state = SESSIONS.setdefault(session_id, ConversationState())
    bot_reply = reply(payload.message, state)
    return ChatResponse(session_id=session_id, reply=bot_reply, state=state.as_dict())
