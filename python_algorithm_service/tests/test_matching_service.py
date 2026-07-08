from app.schemas.matching import RecommendTaskWorkersRequest
from app.services.matching_service import MatchingService


class StubRuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None):
        from app.domain.common.types import RuleConfig

        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_test",
            config={"project_id": project_id},
        )


class StubFeatureService:
    def __init__(self, features_by_worker_id: dict[str, dict]) -> None:
        self.features_by_worker_id = features_by_worker_id
        self.seen_worker_ids: list[str] = []

    def get_worker_features(self, payload: dict) -> dict:
        worker_id = payload["worker_id"]
        self.seen_worker_ids.append(worker_id)
        return self.features_by_worker_id[worker_id]


def test_recommend_uses_feature_service_per_worker_output_for_scoring() -> None:
    feature_service = StubFeatureService(
        features_by_worker_id={
            "worker-a": {"active_load": 1, "recent_pass_rate": 0.3},
            "worker-b": {"active_load": 1, "recent_pass_rate": 0.95},
        }
    )
    service = MatchingService(
        rule_repository=StubRuleRepository(),
        feature_service=feature_service,
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-a", "worker-b"],
            top_k=2,
            context={
                "worker_profiles": {
                    "worker-a": {"active_load": 10, "pass_rate": 0.99},
                    "worker-b": {"active_load": 0, "pass_rate": 0.1},
                }
            },
        )
    )

    assert feature_service.seen_worker_ids == ["worker-a", "worker-b"]
    assert response.rule_version == "matching_rules_test"
    assert response.result.recommendations[0].worker_id == "worker-b"
    assert response.result.recommendations[0].reasons == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
    ]


def test_recommend_promotes_explanations_and_warnings_to_service_envelope() -> None:
    service = MatchingService(
        rule_repository=StubRuleRepository(),
        feature_service=StubFeatureService(
            features_by_worker_id={
                "worker-b": {"active_load": 4, "recent_pass_rate": 0.95},
            }
        ),
    )

    response = service.recommend(
        RecommendTaskWorkersRequest(
            task_id="task-1",
            project_id="project-1",
            batch_id="batch-1",
            candidate_worker_ids=["worker-b"],
            top_k=1,
            context={"is_rework": True, "original_worker_id": "worker-b"},
        )
    )

    assert response.result.recommendations[0].reasons == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
        "rework_original_worker_preferred",
    ]
    assert response.result.recommendations[0].warnings == ["load_high"]
    assert [reason.code for reason in response.reasons] == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
        "rework_original_worker_preferred",
    ]
    assert response.reasons[-1].message == "Original worker received a rework continuity boost."
    assert [warning.code for warning in response.warnings] == ["load_high"]
    assert response.warnings[0].message == "Active workload is at or above the high-load threshold."
