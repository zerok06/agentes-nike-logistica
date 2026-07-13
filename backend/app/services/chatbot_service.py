import os
import re
import html
from groq import AsyncGroq
from app.core.redis import check_semantic_cache, save_to_semantic_cache

client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL_NAME = "llama3-8b-8192"

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

async def ask_logistics_chatbot(user_question: str, inventory_context: str) -> str:
    """Función principal para procesar la pregunta del usuario."""
    
    clean_question = sanitize_input(user_question)
    cached_response = await check_semantic_cache(clean_question)
    if cached_response:
        return cached_response

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
    
    await save_to_semantic_cache(clean_question, safe_response)
    
    return safe_response