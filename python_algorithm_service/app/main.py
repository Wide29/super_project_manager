from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi import FastAPI

from app.api.error_handling import (
    REQUEST_ID_HEADER,
    get_request_id,
    request_validation_exception_handler,
    sanitize_request_id,
    unhandled_exception_handler,
)
from app.api.routes.health import router as health_router
from app.api.routes.matching import router as matching_router
from app.api.routes.risk import router as risk_router
from app.api.routes.sampling import router as sampling_router
from app.infra.logging import setup_logging
from app.infra.settings import settings


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request.state.request_id = sanitize_request_id(request.headers.get(REQUEST_ID_HEADER))
        if request.state.request_id is None:
            request.state.request_id = get_request_id(request)
        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request.state.request_id
        return response

    app.add_exception_handler(
        RequestValidationError,
        request_validation_exception_handler,
    )
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.include_router(health_router)
    app.include_router(matching_router)
    app.include_router(risk_router)
    app.include_router(sampling_router)
    return app


app = create_app()
