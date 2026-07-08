from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.infra.logging import setup_logging
from app.infra.settings import settings


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.include_router(health_router)
    return app


app = create_app()
