from typing import Generic, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field

T = TypeVar("T")

SERVICE_VERSION = "v1"
HEALTH_RULE_VERSION = "health_rules_v1"
HEALTH_FEATURE_VERSION = "health_feature_v1"


class HealthResult(BaseModel):
    status: str


class ServiceEnvelope(BaseModel, Generic[T]):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    service: str
    service_version: str = SERVICE_VERSION
    rule_version: str
    feature_version: str
    result: T
    reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    debug: dict = Field(default_factory=dict)

