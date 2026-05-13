from sentence_transformers import SentenceTransformer
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

from pgvector.asyncpg import register_vector

from reranking import rerank


load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")


async def keyword_search(conn, table, query, limit=10):
    results = await conn.fetch(f"""
            SELECT content, ts_rank(fts, plainto_tsquery('english', $1)) AS rank
            FROM {table}
            WHERE fts @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT $2
        """, query, limit)
    
    chunks = [content for (content, _) in results]

    return chunks



async def vector_search(conn, model, table, query):
    query_embedding = model.encode(query).tolist()

    results = await conn.fetch(f"""
            SELECT content, 1 - (embedding <=> $1::vector) AS similarity
            FROM {table}
            ORDER BY embedding <=> $1::vector 
            LIMIT 10                   
            
        """, query_embedding)
    
    chunks = [content for (content, _) in results]

    # reranked_results = rerank(query, chunks)
    
    return chunks

async def hybrid_search(conn, model, table, query):
    vector_results = await vector_search(conn, model, table, query)
    keyword_results = await keyword_search(conn, table, query)

    deduplicated_chunks = list(set([*vector_results, *keyword_results]))

    reranked_results = rerank(query, deduplicated_chunks)

    return reranked_results


async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await register_vector(conn)

    query = "gravity light"

    # print("=== FIXED SIZE CHUNKS ===")
    # for (content, similarity) in await vector_search(conn, model, "fixed_size_chunks", query):
    #     print(f"{similarity} : \n{content}\n\n")
        
    print("=== SENTENCE CHUNKS ===")
    for (rank, text) in await hybrid_search(conn, model, "sentence_chunks", query):
        print(f"{rank} : \n{text}\n\n")
        


    # print("=== PARAGRAPH CHUNKS ===")
    # for (content, similarity) in await vector_search(conn, model, "paragraph_chunks", query):
    #     print(f"{similarity} : \n{content}\n\n")


    # print("=== RECURSIVE CHUNKS ===")
    # for (content, similarity) in await vector_search(conn, model, "recursive_chunks", query):
    #     print(f"{similarity} : \n{content}\n\n")


    # print("=== SEMANTIC CHUNKS ===")
    # for (content, similarity) in await vector_search(conn, model, "semantic_chunks", query):
    #     print(f"{similarity} : \n{content}\n\n")

if __name__ == "__main__":
    asyncio.run(main())