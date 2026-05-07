from fastapi import APIRouter, Request
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm import generate_response
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/")
async def send_message(body: ChatRequest):
    messages = [msg.model_dump() for msg in body.messages]

    return StreamingResponse(
        generate_response(messages=messages),
        media_type="text/event-stream",
    )
