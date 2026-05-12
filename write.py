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


async def embed_and_write(conn, table, chunks, model):
        embeddings = model.encode(chunks)

        rows = [
            (chunk, embedding.tolist()) 
            for chunk, embedding in zip(chunks, embeddings)
        ]

        await conn.executemany(
            f"INSERT INTO {table} (content, embedding) VALUES ($1, $2)", 
            rows
        )



if __name__ == "__main__":
    asyncio.run(test())