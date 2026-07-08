from app.domain.matching.filters import filter_candidates
from app.domain.matching.policies import apply_policies
from app.domain.matching.scorer import score_candidate
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ServiceEnvelope
from app.schemas.matching import (
    RecommendationItem,
    RecommendTaskWorkersRequest,
    RecommendTaskWorkersResult,
)
from app.services.feature_service import FeatureService

MATCHING_FEATURE_VERSION = "matching_feature_v1"


class MatchingService:
    def __init__(
        self,
        rule_repository: RuleRepository | None = None,
        feature_service: FeatureService | None = None,
    ) -> None:
        self.rule_repository = rule_repository or RuleRepository()
        self.feature_service = feature_service or FeatureService()

    def recommend(
        self, payload: RecommendTaskWorkersRequest
    ) -> ServiceEnvelope[RecommendTaskWorkersResult]:
        rule = self.rule_repository.get_rule("matching", payload.project_id)
        worker_features = self.feature_service.get_worker_features(payload.model_dump())
        scoring_context = dict(payload.context)

        if payload.candidate_worker_ids:
            worker_profiles = dict(scoring_context.get("worker_profiles", {}))
            for worker_id in payload.candidate_worker_ids:
                worker_profiles.setdefault(worker_id, worker_features)
            scoring_context["worker_profiles"] = worker_profiles

        candidates = []
        for worker_id in filter_candidates(payload.candidate_worker_ids):
            base_score, reasons, warnings = score_candidate(worker_id, scoring_context)
            final_score = apply_policies(worker_id, base_score, scoring_context)
            candidates.append((worker_id, final_score, reasons, warnings))

        candidates.sort(key=lambda item: item[1], reverse=True)
        items = [
            RecommendationItem(
                worker_id=worker_id,
                rank=index + 1,
                score=score,
                reasons=reasons,
                warnings=warnings,
            )
            for index, (worker_id, score, reasons, warnings) in enumerate(candidates[: payload.top_k])
        ]

        return ServiceEnvelope[RecommendTaskWorkersResult](
            service="matching",
            rule_version=rule.rule_version,
            feature_version=MATCHING_FEATURE_VERSION,
            result=RecommendTaskWorkersResult(recommendations=items),
        )
