# Nike Logística Backend API

## Base URL

http://localhost:8000

## API Version

/api/v1

---

## GET /

Descripción:
Verifica que la API se encuentra disponible.

Respuesta:

{
  "message": "Nike Logística Backend funcionando"
}

---

## GET /api/v1/health

Descripción:
Verifica el estado del servicio.

Respuesta:

{
  "status": "ok",
  "service": "nike-logistica-backend"
}

## Próximos módulos

- Auth
- Inventory
- Products
- Warehouses
- Transfers
- Audit Logs
- Chatbot IA