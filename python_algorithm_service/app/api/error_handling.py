from typing import Any
from uuid import uuid4

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.common import ExplanationModel, SERVICE_VERSION, ServiceEnvelope

UNAVAILABLE_RULE_VERSION = "unavailable"
UNAVAILABLE_FEATURE_VERSION = "unavailable"
REQUEST_ID_HEADER = "X-Request-ID"
VALIDATION_ERROR_CODE = "validation_error"
INTERNAL_ERROR_CODE = "internal_error"
MAX_REQUEST_ID_LENGTH = 128
ALLOWED_REQUEST_ID_CHARS = set(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    "-_.:"
)


def sanitize_request_id(value: str | None) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    if not stripped or len(stripped) > MAX_REQUEST_ID_LENGTH:
        return None
    if any(char not in ALLOWED_REQUEST_ID_CHARS for char in stripped):
        return None
    return stripped


def get_request_id(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None)
    request_id = sanitize_request_id(request_id)
    if request_id:
        return request_id

    generated = str(uuid4())
    request.state.request_id = generated
    return generated


def attach_request_context(
    request: Request, envelope: ServiceEnvelope[Any]
) -> ServiceEnvelope[Any]:
    envelope.request_id = get_request_id(request)
    return envelope


def resolve_service_name(path: str) -> str:
    if path.startswith("/api/v1/matching"):
        return "matching"
    if path.startswith("/api/v1/risk"):
        return "risk"
    if path.startswith("/api/v1/sampling"):
        return "sampling"
    if path.startswith("/health"):
        return "health"
    return "unknown"


def build_error_response(
    request: Request,
    *,
    status_code: int,
    reason_code: str,
    message: str,
    debug: dict[str, Any] | None = None,
) -> JSONResponse:
    envelope = ServiceEnvelope[dict[str, Any]](
        request_id=get_request_id(request),
        service=resolve_service_name(request.url.path),
        service_version=SERVICE_VERSION,
        rule_version=UNAVAILABLE_RULE_VERSION,
        feature_version=UNAVAILABLE_FEATURE_VERSION,
        result={},
        reasons=[ExplanationModel(code=reason_code, message=message)],
        warnings=[],
        debug=debug or {},
    )
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(envelope),
        headers={REQUEST_ID_HEADER: envelope.request_id},
    )


async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return build_error_response(
        request,
        status_code=422,
        reason_code=VALIDATION_ERROR_CODE,
        message="The request payload did not pass validation.",
        debug={"errors": exc.errors()},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return build_error_response(
        request,
        status_code=500,
        reason_code=INTERNAL_ERROR_CODE,
        message="The service could not complete the request.",
        debug={"error_type": exc.__class__.__name__},
    )
