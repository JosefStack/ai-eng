import asyncio
import asyncpg
from pgvector.asyncpg import register_vector
from sentence_transformers import SentenceTransformer
from search import hybrid_search
import os
from dotenv import load_dotenv

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")

eval_set = [
    {
        "question": "What did Einstein publish in 1905?",
        "relevant_chunk": "Einstein developed the special theory of relativity in 1905",
    },
    {
        "question": "How should pasta water be prepared?",
        "relevant_chunk": "heavily salted",
    },
    {
        "question": "What does the water cycle describe?",
        "relevant_chunk": "continuous movement of water",
    },
    {
        "question": "How does gravity affect light?",
        "relevant_chunk": "bending of light around massive objects",
    },
    {
        "question": "What is space-time?",
        "relevant_chunk": "space and time were interwoven into a single continuum",
    },
]


async def evaluate(conn, model, table):
    hits = 0
    reciprocal_ranks = []

    for item in eval_set:
        results = await hybrid_search(conn, model, table, item['question'])
        retrieved_chunks = [text for (rank, text) in results]

        hit = False
        for i, chunk in enumerate(retrieved_chunks):
            if item['relevant_chunk'].lower() in chunk.lower():
                hit = True
                reciprocal_ranks.append(1 / (i + 1))
                break

        if not hit:
            reciprocal_ranks.append(0) 
        else:
            hits += 1
        
        print(f"Q: {item['question']}")
        print(f"Hit: {hit} | Rank: {1 / reciprocal_ranks[-1] if reciprocal_ranks[-1] > 0 else 'not found'}")

    hit_rate = hits/len(eval_set)
    # Mean Reciprocal Rank
    mrr = sum(reciprocal_ranks) / len(eval_set)
    
    print(f"=== RESULTS ===")
    print(f"Table: {table}")
    print(f"Hit Rate: {hit_rate:.2%}")
    print(f"MRR: {mrr:.3f}")
    return hit_rate, mrr





async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await register_vector(conn, schema='public')

    tables = [
        "paragraph_chunks",
        "sentence_chunks",
        "recursive_chunks",
        "semantic_chunks", 
        "fixed_size_chunks",
    ]
    
    for table in tables:
        print(f"\n{'='*40}")
        await evaluate(conn, model, table)

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())





