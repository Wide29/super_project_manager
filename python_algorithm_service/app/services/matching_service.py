from app.domain.matching.filters import filter_candidates
from app.domain.matching.policies import apply_policies
from app.domain.matching.scorer import score_candidate
from app.infra.repositories.rule_repository import RuleRepository
from app.schemas.common import ExplanationModel, ServiceEnvelope, WarningModel
from app.schemas.matching import (
    RecommendationItem,
    RecommendTaskWorkersRequest,
    RecommendTaskWorkersResult,
)
from app.services.feature_service import FeatureService

MATCHING_FEATURE_VERSION = "matching_feature_v1"
MATCHING_REASON_MESSAGES = {
    "active_load_considered": "Active workload was included in the matching score.",
    "recent_pass_rate_considered": "Recent pass rate from worker features was included in the matching score.",
    "recent_pass_rate_high": "Recent pass rate is above the strong-performer threshold.",
    "rework_original_worker_preferred": "Original worker received a rework continuity boost.",
}
MATCHING_WARNING_MESSAGES = {
    "load_high": "Active workload is at or above the high-load threshold.",
}


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
        candidates: list[tuple[str, float, list[str], list[str]]] = []
        for worker_id in filter_candidates(payload.candidate_worker_ids):
            worker_features = self.feature_service.get_worker_features(
                self._build_worker_feature_payload(payload, worker_id)
            )
            base_score, reasons, warnings = score_candidate(worker_id, worker_features)
            final_score, policy_reasons, policy_warnings = apply_policies(
                worker_id,
                base_score,
                payload.context,
            )
            candidates.append(
                (
                    worker_id,
                    final_score,
                    reasons + policy_reasons,
                    warnings + policy_warnings,
                )
            )

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
            reasons=self._build_reasons(items),
            warnings=self._build_warnings(items),
        )

    @staticmethod
    def _build_worker_feature_payload(
        payload: RecommendTaskWorkersRequest,
        worker_id: str,
    ) -> dict:
        worker_payload = payload.model_dump()
        worker_payload["worker_id"] = worker_id
        return worker_payload

    @staticmethod
    def _build_reasons(
        recommendations: list[RecommendationItem],
    ) -> list[ExplanationModel]:
        seen_codes: set[str] = set()
        reasons: list[ExplanationModel] = []

        for item in recommendations:
            for code in item.reasons:
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                reasons.append(
                    ExplanationModel(
                        code=code,
                        message=MATCHING_REASON_MESSAGES.get(code, code),
                    )
                )

        return reasons

    @staticmethod
    def _build_warnings(
        recommendations: list[RecommendationItem],
    ) -> list[WarningModel]:
        seen_codes: set[str] = set()
        warnings: list[WarningModel] = []

        for item in recommendations:
            for code in item.warnings:
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                warnings.append(
                    WarningModel(
                        code=code,
                        message=MATCHING_WARNING_MESSAGES.get(code, code),
                    )
                )

        return warnings
