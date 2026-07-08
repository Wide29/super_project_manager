from app.domain.risk.task_risk import score_task_risk
from app.domain.risk.worker_risk import score_worker_risk
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ExplanationModel, ServiceEnvelope
from app.schemas.risk import (
    TaskRiskRequest,
    TaskRiskResult,
    WorkerRiskRequest,
    WorkerRiskResult,
)
from app.services.feature_service import FeatureService

TASK_RISK_FEATURE_VERSION = "task_risk_feature_v1"
WORKER_RISK_FEATURE_VERSION = "worker_risk_feature_v1"


class RiskService:
    def __init__(
        self,
        rule_repository: RuleRepository | None = None,
        feature_service: FeatureService | None = None,
    ) -> None:
        self.rule_repository = rule_repository or RuleRepository()
        self.feature_service = feature_service or FeatureService()

    def score_task(self, payload: TaskRiskRequest) -> ServiceEnvelope[TaskRiskResult]:
        rule = self.rule_repository.get_rule("task_risk", payload.project_id)
        features = self.feature_service.get_task_features(payload.model_dump())
        score, level, reason_codes = score_task_risk(features.get("context", {}))
        return ServiceEnvelope[TaskRiskResult](
            service="risk",
            rule_version=rule.rule_version,
            feature_version=TASK_RISK_FEATURE_VERSION,
            result=TaskRiskResult(
                risk_score=score,
                risk_level=level.value,
                reason_codes=reason_codes,
            ),
            reasons=[ExplanationModel(code=code, message=code) for code in reason_codes],
        )

    def score_worker(self, payload: WorkerRiskRequest) -> ServiceEnvelope[WorkerRiskResult]:
        rule = self.rule_repository.get_rule("worker_risk", payload.project_id)
        features = self.feature_service.get_worker_features(payload.model_dump())
        score, level, reason_codes = score_worker_risk(features.get("context", {}))
        return ServiceEnvelope[WorkerRiskResult](
            service="risk",
            rule_version=rule.rule_version,
            feature_version=WORKER_RISK_FEATURE_VERSION,
            result=WorkerRiskResult(
                risk_score=score,
                risk_level=level.value,
                reason_codes=reason_codes,
                window_type=payload.window_type,
            ),
            reasons=[ExplanationModel(code=code, message=code) for code in reason_codes],
        )
