from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.risk import router as risk_router
from app.api.routes.sampling import router as sampling_router
from app.infra.logging import setup_logging
from app.infra.settings import settings


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.include_router(health_router)
    app.include_router(risk_router)
    app.include_router(sampling_router)
    return app


app = create_app()
