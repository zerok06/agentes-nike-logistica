# Prompts de Configuración: Backend (FastAPI)

Este archivo contiene la secuencia de sub-prompts técnicos estructurados bajo la metodología SDD para la configuración paso a paso del backend en FastAPI.

---

## Sub-prompt 1: Estructura Base, Keycloak y Modo Demo
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Configura la base del backend utilizando FastAPI (Python) estructurado en una arquitectura por capas.

Tareas:
1. Directorios requeridos:
   - app/api/v1/ (Rutas y Endpoints REST/WebSockets)
   - app/core/ (Seguridad, Keycloak config, Redis, Base de datos, Ajustes)
   - app/services/ (Lógica del negocio, Orquestación de Chatbot, Redis Caché)
   - app/repositories/ (CRUD, logs de auditoría y consultas vectoriales de base de datos)
   - app/models/ (Modelos SQLAlchemy e historial de auditoría)
   - app/schemas/ (Validación Pydantic)

2. Integración de Seguridad y Modo Demo (Keycloak & Mock Mode):
   - Implementa un middleware de seguridad en FastAPI que verifique el token JWT de Keycloak en las cabeceras HTTP.
   - PARTICULARIDAD EVALUATIVA: Si la variable de entorno 'DEMO_MODE=True' está activa en desarrollo, permite sobreescribir la autenticación real mediante el uso de la cabecera 'X-Demo-Role' (Admin, Supervisor, Operador), inyectando los privilegios simulados en el contexto de la petición para que la docente evalúe fácilmente.
   - Valida que cuando un usuario con rol 'Operador' intente acceder a rutas de modificación de stock (o simulación de traslado), se retorne un error HTTP 403 Forbidden.
```

---

## Sub-prompt 2: pgvector, Semillero de Datos y Registro de Auditoría
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Configura PostgreSQL con la extensión pgvector, el script de semillero inteligente y la base de datos de auditoría:

Tareas:
1. Modelos de Base de Datos (app/models/):
   - Define el modelo `Inventory` (id, sku, description, quantity, warehouse_id, location_coords [lat/long], organization_id, created_at, updated_at).
   - Define el modelo `InventoryVector` (id, inventory_id, description_vector [columna de tipo Vector de pgvector], context_metadata [JSON], created_at).
   - Define el modelo `AuditLog` (id, user_id, user_email, action, details [JSON], timestamp) para almacenar logs inmutables de reubicación de stock.

2. Script de Semillero Inteligente (`app/core/seed.py`):
   - Escribe un script que inicialice la base de datos e inserte datos reales de calzado Nike (ej: Air Jordan, Pegasus, Air Max).
   - Carga ubicaciones geográficas reales (latitud/longitud) para simular almacenes e itinerarios de transporte en vivo.
   - Pre-calcula los embeddings de las descripciones del calzado usando 'SentenceTransformers' localmente y guárdalos en `InventoryVector`.

3. Repositorio de Auditoría (app/repositories/audit_repository.py):
   - Crea un repositorio que permita insertar registros de auditoría y leerlos ordenados de forma descendente por marca de tiempo.
```

---

## Sub-prompt 3: Groq API y Caché Semántica con Redis
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Implementa el servicio del Chatbot utilizando la API de Groq e integra la caché semántica con Redis:

Tareas:
1. Conector y Caché Semántica (app/core/redis_client.py):
   - Inicializa el cliente de Redis.
   - Implementa un servicio de caché semántica: calcula el embedding de la pregunta del usuario, y realiza una comparación vectorial en Redis (o caché de claves/valores) para comprobar si existe una pregunta muy similar (>95% de similitud) respondida previamente. Si existe, retorna esa respuesta sin consultar a Groq.

2. Integración de Groq API (app/services/chatbot_service.py):
   - Instala e integra la librería oficial de Groq (`groq`).
   - Configura el cliente asíncrono para enviar consultas utilizando el modelo `llama3-8b-8192` con tu clave API de Groq.
   - Construye el Prompt inyectando los datos de inventario coincidentes obtenidos de pgvector como contexto.

3. Seguridad LLM (LLM Top 10):
   - Agrega un sanitizador en el backend que purgue cadenas sospechosas de inyección de prompts (LLM01).
   - Sanitiza y escapa la respuesta devuelta por Groq para evitar scripts de XSS indirectos (LLM02) en el JSON retornado.
```
