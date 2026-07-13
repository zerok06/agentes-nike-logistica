from collections.abc import Callable
from fastapi import Depends, HTTPException, Request, status
from app.schemas.auth import AuthenticatedUser, UserRole


def get_current_user(request: Request) -> AuthenticatedUser:
    user = getattr(request.state, "user", None)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_roles(
        *allowed_roles: UserRole,
) -> Callable[..., AuthenticatedUser]:
    allowed = set(allowed_roles)

    def role_dependency(
            current_user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if current_user.roles.isdisjoint(allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No posee permisos suficientes",
            )
        return current_user
    return role_dependency