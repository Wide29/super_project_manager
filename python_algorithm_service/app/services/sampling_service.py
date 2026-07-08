from app.domain.sampling.planner import build_sampling_plan
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ExplanationModel, ServiceEnvelope, WarningModel
from app.schemas.sampling import BatchSamplingRequest, BatchSamplingResult
from app.services.feature_service import FeatureService

SAMPLING_FEATURE_VERSION = "sampling_feature_v1"
SAMPLING_FALLBACK_WARNING_CODE = "sampling_fallback_applied"


class SamplingService:
    def __init__(
        self,
        rule_repository: RuleRepository | None = None,
        feature_service: FeatureService | None = None,
    ) -> None:
        self.rule_repository = rule_repository or RuleRepository()
        self.feature_service = feature_service or FeatureService()

    def plan_batch(self, payload: BatchSamplingRequest) -> ServiceEnvelope[BatchSamplingResult]:
        rule = self.rule_repository.get_rule("sampling", payload.project_id)
        features = self.feature_service.get_batch_features(payload.model_dump())
        ratio, selected_task_ids, flags, used_fallback = build_sampling_plan(
            features.get("task_pool", []),
            features,
            rule.config,
        )
        return ServiceEnvelope[BatchSamplingResult](
            service="sampling",
            rule_version=rule.rule_version,
            feature_version=SAMPLING_FEATURE_VERSION,
            result=BatchSamplingResult(
                sampling_ratio=ratio,
                sample_count=len(selected_task_ids),
                selected_task_ids=selected_task_ids,
                recommendation_flags=flags,
            ),
            reasons=[
                ExplanationModel(
                    code="sampling_ratio_selected",
                    message=self._build_ratio_message(
                        features.get("batch_risk_level", "low"), ratio
                    ),
                )
            ],
            warnings=self._build_warnings(used_fallback),
        )

    @staticmethod
    def _build_ratio_message(batch_risk_level: str, ratio: float) -> str:
        return f"Sampling ratio set to {int(ratio * 100)}% for a {batch_risk_level}-risk batch."

    @staticmethod
    def _build_warnings(used_fallback: bool) -> list[WarningModel]:
        if not used_fallback:
            return []
        return [
            WarningModel(
                code=SAMPLING_FALLBACK_WARNING_CODE,
                message=(
                    "No high-risk task was available, so the first task was selected as a fallback."
                ),
            )
        ]
