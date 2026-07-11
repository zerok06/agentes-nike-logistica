from app.schemas.auth import AuthenticatedUser, UserRole

ROLE_ALIASES: dict[str, UserRole] = {
    "admin": UserRole.ADMIN,
    "administrator": UserRole.ADMIN,
    "supervisor": UserRole.SUPERVISOR,
    "operador": UserRole.OPERATOR,
    "operator": UserRole.OPERATOR,
}

def normalize_role(role_name: str) -> UserRole:
    normalized_role = role_name.strip().lower()

    role = ROLE_ALIASES.get(normalized_role)

    if role is None:
        raise ValueError(f"Rol no válido: {role_name}")
    return role

def create_demo_user(role_name: str) -> AuthenticatedUser:
    role = normalize_role(role_name)

    return AuthenticatedUser(
        subject=f"demo-{role.value}",
        email=f"demo-{role.value}@demo.local",
        username=f"demo_{role.value}",
        roles={role},
        is_demo=True,
    )