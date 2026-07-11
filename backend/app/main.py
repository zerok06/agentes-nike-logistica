from fastapi import FastAPI


app = FastAPI(
    title="Nike Logística Backend",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {
        "message": "Nike Logística Backend funcionando",
    }