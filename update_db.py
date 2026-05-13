import asyncpg
import asyncio
from pgvector.asyncpg import register_vector
from dotenv import load_dotenv
import os

load_dotenv()

async def update(table_name):
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await register_vector(conn)
    
    await conn.execute(
        f"""ALTER TABLE {table_name}
        ADD COLUMN fts tsvector 
        GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;"""
    )

    await conn.execute(
        f"CREATE INDEX ON {table_name} USING GIN(fts)"
    )

    await conn.execute(
        f"UPDATE {table_name} SET content = content"
    )

    await conn.close()

if __name__ == "__main__":
    tables = [
        "paragraph_chunks",
        "sentence_chunks",
        "fixed_size_chunks",
        "recursive_chunks",
        "semantic_chunks",
    ]

    for table in tables:
        asyncio.run(update(table))