import os
import asyncio
import asyncpg

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
from pgvector.asyncpg import register_vector

from write import embed_and_write

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")


def load_document(path: str) -> str:
    with open(path, "r") as f:
        return f.read()


def fixed_size_chunks(text: str, chunk_size: int = 200, overlap: int = 20) -> list[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    
    return chunks


def sentence_chunks(text: str) -> list[str]:
    sentences = text.split(". ")
    return [s.strip() + "." for s in sentences if s.strip()]


def paragraph_chunks(text: str) -> list[str]:
    paragraphs = text.split("\n\n")
    return [p.strip()   for p in paragraphs if p.strip()]


def recursive_chunks(text: str, max_size: int = 500) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    for p in paragraphs:
        if len(p) <= max_size:
            chunks.append(p)
        else:
            sentences = [s.strip() for s in p.split(". ") if s.strip()]
            current = ""
            for sentence in sentences:
                if (len(current) + len(sentence.strip()) <= max_size):
                    if current:
                        current += ". " + sentence.strip()
                    else: 
                        current = sentence.strip()
                else:
                    if current:
                        chunks.append(current)
                        current = sentence.strip()
            if current:
                chunks.append(current.strip())
    
    return chunks


def semantic_chunks(text: str, threshold: float = 0.5) -> list[str]:
    sentences  = [s.strip() for s in text.split(". ") if s.strip()]
    embeddings = model.encode(sentences)

    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(embeddings)):
        similarity = util.cos_sim(embeddings[i-1], embeddings[i]).item()
        # .item() for converting into plain float

        if similarity < threshold:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentences[i]]
        else:
            current_chunk.append(sentences[i])
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks


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