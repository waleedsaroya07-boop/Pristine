from __future__ import annotations

from pathlib import Path
import json
import sqlite3
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pristine_bot import ConversationState, reply

BASE_DIR=Path(__file__).resolve().parent
DB_PATH=BASE_DIR/'data'/'leads.db'
app=FastAPI(title='Pristine Apparel Wholesale Chatbot',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_credentials=False,allow_methods=['GET','POST'],allow_headers=['*'])
app.mount('/static',StaticFiles(directory=BASE_DIR/'static'),name='static')
SESSIONS:dict[str,ConversationState]={}

class ChatRequest(BaseModel):
    session_id:str|None=None
    message:str=Field(min_length=1,max_length=4000)
class ChatResponse(BaseModel):
    session_id:str
    reply:str
    state:dict
class LeadRequest(BaseModel):
    session_id:str
    name:str=Field(min_length=1,max_length=200)
    organisation:str|None=Field(default=None,max_length=200)
    email:str|None=Field(default=None,max_length=320)
    phone:str|None=Field(default=None,max_length=100)
    destination:str|None=Field(default=None,max_length=300)

def init_db():
    DB_PATH.parent.mkdir(parents=True,exist_ok=True)
    with sqlite3.connect(DB_PATH) as c:
        c.execute('''CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,name TEXT NOT NULL,organisation TEXT,email TEXT,phone TEXT,destination TEXT,state_json TEXT NOT NULL)''')

@app.on_event('startup')
def startup(): init_db()
@app.get('/health')
def health(): return {'ok':True,'service':'pristine-apparel-chatbot'}
@app.get('/')
def index(): return FileResponse(BASE_DIR/'static'/'demo.html')
@app.post('/api/chat',response_model=ChatResponse)
def chat(p:ChatRequest):
    sid=p.session_id or str(uuid.uuid4()); state=SESSIONS.setdefault(sid,ConversationState())
    return ChatResponse(session_id=sid,reply=reply(p.message,state),state=state.as_dict())
@app.post('/api/lead')
def save_lead(p:LeadRequest):
    state=SESSIONS.get(p.session_id)
    if not state: raise HTTPException(404,'Unknown chat session')
    if not p.email and not p.phone: raise HTTPException(422,'Provide at least an email or phone/WhatsApp number')
    state.name,state.organisation,state.email,state.phone,state.destination=p.name,p.organisation,p.email,p.phone,p.destination
    with sqlite3.connect(DB_PATH) as c:
        c.execute('INSERT INTO leads(session_id,name,organisation,email,phone,destination,state_json) VALUES(?,?,?,?,?,?,?)',(p.session_id,p.name,p.organisation,p.email,p.phone,p.destination,json.dumps(state.as_dict(),ensure_ascii=False)))
    return {'ok':True,'message':'Enquiry captured for wholesale quotation. No order or payment has been placed.','state':state.as_dict()}
