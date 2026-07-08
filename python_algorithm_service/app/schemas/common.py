from typing import Any, Generic, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

T = TypeVar("T")

SERVICE_VERSION = "v1"
HEALTH_RULE_VERSION = "health_rules_v1"
HEALTH_FEATURE_VERSION = "health_feature_v1"


class HealthResult(BaseModel):
    status: str


class ExplanationModel(BaseModel):
    code: str
    message: str


class WarningModel(BaseModel):
    code: str
    message: str


class ServiceEnvelope(BaseModel, Generic[T]):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    service: str
    service_version: str = SERVICE_VERSION
    rule_version: str
    feature_version: str
    result: T
    reasons: list[ExplanationModel] = Field(default_factory=list)
    warnings: list[WarningModel] = Field(default_factory=list)
    debug: dict[str, Any] = Field(default_factory=dict)
