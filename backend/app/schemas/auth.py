from enum import StrEnum
from pydantic import BaseModel, Field

class UserRole(StrEnum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    OPERATOR = "operador"

class AuthenticatedUser(BaseModel):
    subject: str
    email: str | None = None
    username: str | None = None
    roles: set[UserRole] = Field(default_factory=set)
    is_demo: bool = False


