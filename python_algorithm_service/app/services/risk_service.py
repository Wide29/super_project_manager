from app.domain.risk.task_risk import score_task_risk
from app.domain.risk.worker_risk import score_worker_risk
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ExplanationModel, ServiceEnvelope, WarningModel
from app.schemas.risk import (
    TaskRiskRequest,
    TaskRiskResult,
    WorkerRiskRequest,
    WorkerRiskResult,
)
from app.services.feature_service import FeatureService

TASK_RISK_FEATURE_VERSION = "task_risk_feature_v1"
WORKER_RISK_FEATURE_VERSION = "worker_risk_feature_v1"
RISK_REASON_MESSAGES = {
    "rework_count_high": "Rework count is above the high-risk threshold.",
    "deadline_pressure": "Deadline is too close and increases delivery pressure.",
    "historical_defect_high": "Historical defect rate is above the acceptable threshold.",
    "pass_rate_drop": "Recent pass rate dropped below the healthy threshold.",
    "rework_rate_high": "Recent rework rate is above the acceptable threshold.",
    "load_high": "Active workload is at or above the high-load threshold.",
}


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
        feature_payload = payload.model_dump()
        feature_snapshot = FeatureService.ensure_task_snapshot(
            self.feature_service.get_task_features(feature_payload)
        )
        score, level, reason_codes = score_task_risk(feature_snapshot.values, rule.config)
        return ServiceEnvelope[TaskRiskResult](
            service="risk",
            rule_version=rule.rule_version,
            feature_version=TASK_RISK_FEATURE_VERSION,
            result=TaskRiskResult(
                risk_score=score,
                risk_level=level.value,
                reason_codes=reason_codes,
            ),
            reasons=[self._build_reason(code) for code in reason_codes],
            warnings=self._build_missing_feature_warnings(
                "task_features_missing",
                "task features",
                feature_snapshot.missing_fields,
            ),
        )

    def score_worker(self, payload: WorkerRiskRequest) -> ServiceEnvelope[WorkerRiskResult]:
        rule = self.rule_repository.get_rule("worker_risk", payload.project_id)
        feature_payload = payload.model_dump()
        feature_snapshot = FeatureService.ensure_worker_snapshot(
            self.feature_service.get_worker_features(feature_payload),
            feature_payload,
        )
        score, level, reason_codes = score_worker_risk(feature_snapshot.values, rule.config)
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
            reasons=[self._build_reason(code) for code in reason_codes],
            warnings=self._build_missing_feature_warnings(
                "worker_features_missing",
                "worker features",
                feature_snapshot.missing_fields,
            ),
        )

    @staticmethod
    def _build_reason(code: str) -> ExplanationModel:
        return ExplanationModel(code=code, message=RISK_REASON_MESSAGES.get(code, code))

    @staticmethod
    def _build_missing_feature_warnings(
        code: str,
        subject: str,
        missing_fields: list[str],
    ) -> list[WarningModel]:
        if not missing_fields:
            return []
        return [
            WarningModel(
                code=code,
                message=(
                    "Conservative defaults were used because "
                    f"{subject} were missing: {', '.join(missing_fields)}."
                ),
            )
        ]
