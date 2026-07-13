from fastapi import APIRouter, Depends
from app.api.deps.auth import require_roles
from app.schemas.auth import AuthenticatedUser, UserRole


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.get("/protected")
async def protected_route(
    current_user: AuthenticatedUser = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
) -> dict[str, object]:
    return {
        "message": "Acceso autorizado",
        "user": current_user.model_dump(),
    }