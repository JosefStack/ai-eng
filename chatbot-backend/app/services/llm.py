from groq import AsyncGroq
from app.config import settings

client = AsyncGroq(api_key=settings.groq_api_key)

async def generate_response(messages: list[dict]):
    stream = await client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
        stream = True
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            print(type(token))
            yield f"data: {token}\n\n"
            

