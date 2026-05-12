from sentence_transformers import util, SentenceTransformer


model = model = SentenceTransformer("all-MiniLM-L6-v2")


def fixed_sized_chunks(text: str, chunk_size: int = 200, overlap: int = 20) -> list[str]:
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


def semantic_chunks(text: str, threshhold: float = 0.5) -> list[str]:
    sentences  = [s.strip() for s in text.split(". ") if s.strip()]
    embeddings = model.encode(sentences)

    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(embeddings)):
        similarity = util.cos_sim(embeddings[i-1], embeddings[i]).item()
        # .item() for converting into plain float

        if similarity < threshhold:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentences[i]]
        else:
            current_chunk.append(sentences[i])
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

        
