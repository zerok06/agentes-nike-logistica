from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware


from app.core.config import settings
from app.core.security import create_demo_user


PUBLIC_PATHS = {
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/health",
}

class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(
            self,
            request: Request,
            call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)
        
        if not settings.demo_mode:
            return JSONResponse(
                status_code=501,
                content={
                    "detail": (
                        "La autenticación con Keycloak todavía no está implementada"
                    )
                },
            )
        
        demo_role = request.headers.get(settings.demo_role_header)

        if demo_role is None:
            return JSONResponse(
                status_code=401,
                content={
                    "detail": (
                        f"Falta la cabecera {settings.demo_role_header}"
                    )
                },
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            request.state.user = create_demo_user(demo_role)
        except ValueError as exc:
            return JSONResponse(
                status_code=401,
                content={"detail": str(exc)},
            )
        return await call_next(request)
