from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(
    title="Nike Logística Backend",
    version="0.1.0",
)

app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "message": "Nike Logística Backend funcionando",
    }