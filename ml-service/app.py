from fastapi import FastAPI

from db import engine
from models import Base
from routers.settings import router as settings_router
from routers.auth import router as auth_router
from routers.files import router as files_router

app = FastAPI(title="ComedyInsight Configuration Service")

app.include_router(settings_router)
app.include_router(auth_router)
app.include_router(files_router)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/predict", tags=["ml"])
async def predict_stub() -> dict[str, str]:
    return {"message": "ML service placeholder"}


@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

