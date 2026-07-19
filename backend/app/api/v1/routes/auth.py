from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_central_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.api.deps.auth import get_current_user, require_roles
from app.schemas.auth import (
    AuthenticatedUser,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserRole,
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        username=user.username,
        role=user.role,
        warehouse_id=user.warehouse_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def _build_token_response(user: User) -> TokenResponse:
    token_data = {"sub": str(user.user_id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_user_to_response(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_central_db),
) -> TokenResponse:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(credentials.email)

    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado. Contacta al administrador.",
        )

    return _build_token_response(user)


@router.post("/register", response_model=TokenResponse)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_central_db),
) -> TokenResponse:
    user_repo = UserRepository(db)

    existing_email = await user_repo.get_by_email(data.email)
    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email",
        )

    existing_username = await user_repo.get_by_username(data.username)
    if existing_username is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese username",
        )

    hashed = hash_password(data.password)
    user = await user_repo.create(
        email=data.email,
        username=data.username,
        password_hash=hashed,
        role=data.role.value,
    )
    await db.commit()
    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_central_db),
) -> UserResponse:
    if current_user.is_demo:
        return UserResponse(
            user_id=0,
            email=current_user.email or "",
            username=current_user.username or "",
            role=next(iter(current_user.roles)).value if current_user.roles else "operador",
            is_active=True,
            created_at=None,
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(int(current_user.subject))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return _user_to_response(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_central_db),
) -> TokenResponse:
    token_data = decode_token(payload.refresh_token)
    if token_data is None or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido o expirado",
        )

    user_id = int(token_data["sub"])
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no válido",
        )

    return _build_token_response(user)


@router.post("/logout")
async def logout(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, str]:
    return {"message": "Sesión cerrada correctamente"}


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_central_db),
    current_user: AuthenticatedUser = Depends(require_roles(UserRole.ADMIN)),
) -> list[UserResponse]:
    user_repo = UserRepository(db)
    users = await user_repo.list_all()
    return [_user_to_response(u) for u in users]
