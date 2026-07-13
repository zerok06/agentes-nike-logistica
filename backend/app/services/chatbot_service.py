import os
import re
import html
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import check_semantic_cache, save_to_semantic_cache, embedder
from app.repositories.inventory_repository import InventoryRepository

client = AsyncOpenAI(
    api_key=settings.huawei_api_key,
    base_url=settings.huawei_base_url
)
MODEL_NAME = settings.huawei_model

def sanitize_input(user_input: str) -> str:
    """LLM01: Sanitizador para evitar inyección de prompts."""
    suspicious_patterns = [
        r"(?i)\b(ignore|olvida)\b.*?(instrucciones|instructions)",
        r"(?i)(system:|sistema:|eres un bot)",
        r"(?i)bypass"
    ]
    
    sanitized = user_input
    for pattern in suspicious_patterns:
        sanitized = re.sub(pattern, "[BLOQUEADO]", sanitized)
    
    return sanitized

def sanitize_output(llm_output: str) -> str:
    """LLM02: Sanitiza la respuesta de Groq para evitar scripts XSS."""
    return html.escape(llm_output)

async def ask_logistics_chatbot(user_question: str, db_session: AsyncSession) -> str:
    """Función principal para procesar la pregunta del usuario utilizando RAG."""
    
    clean_question = sanitize_input(user_question)
    
    # Comprobar la caché semántica con Redis
    cached_response = await check_semantic_cache(clean_question)
    if cached_response:
        return cached_response

    # Búsqueda semántica de productos mediante pgvector
    question_embedding = embedder.encode(clean_question).tolist()
    inv_repo = InventoryRepository(db_session)
    similar_embeddings = await inv_repo.search_similar_products(question_embedding, limit=5)
    
    # Construcción del contexto del inventario para el Prompt
    context_items = []
    for emb in similar_embeddings:
        p = emb.product
        if p:
            context_items.append(
                f"- SKU: {p.sku} | Producto: {p.product_name} | Modelo: {p.model} | "
                f"Género: {p.gender} | Precio: ${p.unit_price} | Descripción: {p.description}"
            )
            
    inventory_context = "\n".join(context_items) if context_items else "No se encontraron productos coincidentes en el catálogo."

    system_prompt = f"""
    Eres un Asistente Logístico IA experto de Nike. 
    Responde de forma concisa basándote ÚNICAMENTE en este contexto de inventario:
    {inventory_context}
    
    Si el usuario pregunta algo fuera del contexto logístico, indica que solo puedes ayudar con temas de inventario y envíos.
    """

    chat_completion = await client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": clean_question}
        ],
        model=MODEL_NAME,
        temperature=0.3, 
    )
    
    raw_response = chat_completion.choices[0].message.content
    
    safe_response = sanitize_output(raw_response)
    
    # Guardar en caché semántica de Redis
    await save_to_semantic_cache(clean_question, safe_response)
    
    return safe_response