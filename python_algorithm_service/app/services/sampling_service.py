from app.domain.sampling.planner import build_sampling_plan
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ExplanationModel, ServiceEnvelope
from app.schemas.sampling import BatchSamplingRequest, BatchSamplingResult
from app.services.feature_service import FeatureService

SAMPLING_FEATURE_VERSION = "sampling_feature_v1"


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
        ratio, selected_task_ids, flags = build_sampling_plan(
            [item.model_dump() for item in payload.task_pool],
            features.get("context", {}),
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
                ExplanationModel(code="sampling_ratio_selected", message="sampling_ratio_selected")
            ],
        )
