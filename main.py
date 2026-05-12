import os
import asyncio
import asyncpg

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
from pgvector.asyncpg import register_vector

from write import embed_and_write
from chunking import *

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")


def load_document(path: str) -> str:
    with open(path, "r") as f:
        return f.read()

async def main():
    text = load_document("data/documents.txt")        


    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await register_vector(conn) 

    print("Writing into fixed_size_chunks")
    await embed_and_write(conn, "fixed_size_chunks", fixed_size_chunks(text), model)

    print("Writing into paragraph_chunks")
    await embed_and_write(conn, "paragraph_chunks", paragraph_chunks(text), model)

    print("Writing into recursive_chunks")
    await embed_and_write(conn, "recursive_chunks", recursive_chunks(text), model)

    print("Writing into sentence_chunks")
    await embed_and_write(conn, "sentence_chunks", sentence_chunks(text), model)

    print("Writing into semantic_chunks")
    await embed_and_write(conn, "semantic_chunks", semantic_chunks(text), model)

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())