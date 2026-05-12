import asyncpg
import asyncio
from pgvector.asyncpg import register_vector
from dotenv import load_dotenv
import os

load_dotenv()

async def test():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await register_vector(conn)
    print("Connected successfully.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(test())