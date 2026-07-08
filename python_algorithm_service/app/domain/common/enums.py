from enum import StrEnum


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class WindowType(StrEnum):
    DAYS_7 = "7d"
    DAYS_14 = "14d"
    DAYS_30 = "30d"
