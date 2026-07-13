import json
import os
import redis.asyncio as redis
from sentence_transformers import SentenceTransformer, util


redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

async def check_semantic_cache(user_question: str, threshold: float = 0.95):
    """Calcula el embedding y busca en Redis una pregunta similar (>95%)"""
    question_embedding = embedder.encode(user_question)
    

    keys = await redis_client.keys("cache:chat:*")
    
    best_match_response = None
    highest_score = 0.0

    for key in keys:
        cached_data = await redis_client.get(key)
        if cached_data:
            data = json.loads(cached_data)
            cached_embedding = data.get("embedding")
            
            # Comparamos matemáticamente los vectores
            similarity = util.cos_sim(question_embedding, cached_embedding).item()
            
            if similarity > highest_score and similarity >= threshold:
                highest_score = similarity
                best_match_response = data.get("response")

    return best_match_response

async def save_to_semantic_cache(user_question: str, bot_response: str):
    """Guarda la pregunta y la respuesta en Redis por 24 horas"""
    question_embedding = embedder.encode(user_question).tolist()
    cache_key = f"cache:chat:{abs(hash(user_question))}"
    
    cache_data = {
        "question": user_question,
        "embedding": question_embedding,
        "response": bot_response
    }
    
    
    await redis_client.setex(cache_key, 86400, json.dumps(cache_data))