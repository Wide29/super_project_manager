from pydantic import BaseModel, Field

from app.domain.common.enums import RiskLevel, WindowType


class TaskRiskRequest(BaseModel):
    task_id: str
    project_id: str
    context: dict = Field(default_factory=dict)


class TaskRiskResult(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    reason_codes: list[str]


class WorkerRiskRequest(BaseModel):
    worker_id: str
    project_id: str
    window_type: WindowType = WindowType.DAYS_7
    context: dict = Field(default_factory=dict)


class WorkerRiskResult(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    reason_codes: list[str]
    window_type: WindowType
