from app.domain.matching.policies import apply_policies
from app.domain.matching.scorer import score_candidate


def test_apply_policies_boosts_original_worker_for_rework() -> None:
    base_score, _, _ = score_candidate(
        "worker-b",
        {"worker_profiles": {"worker-b": {"active_load": 1, "pass_rate": 0.9}}},
    )

    boosted = apply_policies(
        "worker-b",
        base_score,
        {"is_rework": True, "original_worker_id": "worker-b"},
    )

    assert boosted > base_score
