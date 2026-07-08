from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class RuleConfig:
    rule_type: str
    rule_version: str
    config: dict[str, Any]


@dataclass(slots=True)
class WarningItem:
    code: str
    message: str


@dataclass(slots=True)
class ExplanationItem:
    code: str
    message: str


@dataclass(slots=True)
class FeaturePayload:
    values: dict[str, Any] = field(default_factory=dict)
