from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_central_db
from app.services.chatbot_service import ask_logistics_chatbot

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

class ChatQuery(BaseModel):
    message: str

class ChatReply(BaseModel):
    response: str

@router.post("/", response_model=ChatReply)
async def chat_with_agent(
    query: ChatQuery,
    db: AsyncSession = Depends(get_central_db)
) -> ChatReply:
    """Endpoint para interactuar con el asistente logístico utilizando RAG (pgvector) y caché semántica (Redis)."""
    response_text = await ask_logistics_chatbot(query.message, db)
    return ChatReply(response=response_text)
