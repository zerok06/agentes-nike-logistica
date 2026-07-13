from fastapi import APIRouter
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.auth import router as auth
from app.api.v1.routes.system import router as system_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth)
api_router.include_router(system_router)