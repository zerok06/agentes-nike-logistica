from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    # Aplicación
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    secret_key: str
    demo_mode: bool = True
    demo_role_header: str = "X-Demo-Role"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Database
    database_url_central: str
    database_url_sede: str
    database_url_retail: str
    database_url_supply: str

    # Keycloak
    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "nike-logistica"
    keycloak_client_id: str = "nike-backend"
    keycloak_client_secret: str
    keycloak_algorithm: str = "RS256"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]
        
        return value
    
@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore

settings = get_settings()